/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable no-underscore-dangle */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import cx from 'classnames';
import update from 'react-addons-update';
import * as R from 'ramda'

import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select'
import Add from '@material-ui/icons/Add'
import Delete from '@material-ui/icons/Delete'
import Edit from '@material-ui/icons/Edit'
import HighlightOff from '@material-ui/icons/HighlightOff'
import InfoOutlined from '@material-ui/icons/InfoOutlined'
import IconButton from '@material-ui/core/IconButton';

import { Div } from 'glamorous'
import * as glamor from 'glamor'

import Pin from './Pin'

import * as Schema from './Schema';
import { capitalize, cloneMap, keyBy } from './util'
import { BaseClassnames, PropTypes as Props } from './constants';
import BaseTable, { BASE_EDITOR_PROPTYPES } from './BaseTable'
import { getSchemaTypeIdentifier, SchemaPopover } from './SchemaView'

const empty = () => null;

// A tabular editor for editing an array of JSON objects in real time
export class ArrayEditor extends React.Component {
  static displayName = 'Editor';

  static propTypes = {
    ...BASE_EDITOR_PROPTYPES,

    // The thing to edit. Must be either
    // * an array of the objects with shape specified in type
    // * undefined
    object: PropTypes.array,

    // Handler called when one of the elements in object is modified
    //
    // function onUpdateElement (updatedElement: Object, index: Number) -> void
    // where updatedElement is the element that has been updated, and
    // index is the index of updatedElement in the the object prop
    onUpdateElement: PropTypes.func.isRequired,

    // Handler called when any elements are removed
    //
    // function onRemoveElements (indices: [Number]) -> void
    // where index is the index of removedElement in the the object prop
    onRemoveElements: PropTypes.func.isRequired,

    // Handler called when a new element is added
    // function onAddElement (newElement: Object) -> void
    // where newElement is the element to add
    onAddElement: PropTypes.func.isRequired,

    // Optimize performance by only creating DOM if the parent is visible
    parentVisible: PropTypes.bool,

    // Default number of rows per page.
    // defaultRowsPerPage: PropTypes.number,

    className: PropTypes.string,
  };

  static defaultProps = {
    className: '',
    // defaultRowsPerPage: 5,
  };

  state = {
    selected: new Map(),
    errorMsg: '',
    isHighlightingAnyRow: false,

    // page: 0,
    // rowsPerPage: this.props.defaultRowsPerPage,
  }

  reqFieldsErrorAlert = (errorMsg) => {
    this.setState({ errorMsg });
  }

  isHighlightingStateChanger = (isHighlightingAnyRow) => {
    this.setState({ isHighlightingAnyRow })
  }


  handleDeleteElements = (elementIndices) => {
    const removedByIndex = keyBy(R.identity, elementIndices)
    const selectedElements = new Map()

    // Update indices of selected elements
    let numberRemoved = 0
    for (let i = 0; i < this.props.object.length; i+=1) {
      if (i in removedByIndex) {
        // Don't select elements that have been removed
        numberRemoved += 1
      } else if (this.state.selected.has(i)) {
        // The new index is shifted by the number that have already been removed
        selectedElements.set(i - numberRemoved, true)
      }
    }

    this.props.onRemoveElements(elementIndices)

    this.setState({
      selected: selectedElements,
    })
  }

  // handleAddPageChange = (page) => this.setState({ page })

  render() {
    const {
      selected
    } = this.state

    // TODO: is there an edge case here with adding/removing elements
    const allElementsSelected = this.props.object
      ? selected.size === this.props.object.length
      : false

    // const elementCount = this.props.object ? this.props.object.length : 0

    // const visibleElements = this.props.object ?
    //   this.props.object.slice(
    //     this.state.page * this.state.rowsPerPage,
    //     this.state.page * this.state.rowsPerPage + this.state.rowsPerPage,
    //   ) :
    //   []
    const visibleElements = this.props.object ? [...this.props.object] : []

    // const realIndex = R.add(this.state.page * this.state.rowsPerPage)
    const realIndex = R.add(0)

    let reqFields = {};
    Object.keys(this.props.type).map(item => {
      if (this.props.type[item] && this.props.type[item].required)
        reqFields[item] = this.props.type[item]._type
      return null
    });

    return (
      <Paper className='array-editor-container'>
        <ArrayToolbar
          schema={this.props.type}
          errorMsg={this.state.errorMsg}
          advListName={this.props.advListName}
          fieldKey={this.props.fieldKey || ''}
          openState={this.props.parentVisible}
          closeArrayModal={this.props.closeArrayModal}
          onDeleteAll={() => this.handleDeleteElements(Array.from(selected.keys()))}
          size={selected.size}
          totalElements={this.props.totalElements}
          searchedQuery={this.props.searchedQuery}
          searchResultCount={this.props.searchResultCount}
        />
        <BaseTable
          type={this.props.type}
          className={cx(BaseClassnames.Editor('--array'), this.props.className)}
          onSelectAll={() => {
            if (allElementsSelected) {
              return this.setState({
                selected: new Map(),
              })
            }

            const selectAll = new Map()
            this.props.object.forEach((el, idx) => selectAll.set(idx, true))
            return this.setState({
              selected: selectAll,
            })
          }}
          checked={allElementsSelected}
          indeterminate={!allElementsSelected && selected.size > 0}
        // totalElements={elementCount}
        // rowsPerPage={this.state.rowsPerPage}
        // page={this.state.page}
        // onChangePage={(evt, page) => this.setState({ page })}
        // onChangeRowsPerPage={evt => this.setState({ rowsPerPage: evt.target.value })}
        >

          {
            this.props.showSearch
            && (
              <SearchObjectRow
                type={this.props.type}
                SearchCallback={this.props.SearchCallback}
              />
            )
          }

          {
            visibleElements.map((el, visibleIndex) => {
              const indexData = this.props.searchResultCount > 0 ? this.props.SearchItemsIndex[visibleIndex] : visibleIndex
              const idx = realIndex(indexData)
              return (
                <ElementRow
                  parentVisible={this.props.parentVisible}
                  key={idx}
                  rowNumber={visibleIndex + 1}
                  className={BaseClassnames.ElementRow('--array')}
                  type={this.props.type}
                  disablingElement
                  object={el}
                  isHighlightingAnyRow={this.state.isHighlightingAnyRow}
                  isHighlightingStateChanger={this.isHighlightingStateChanger}
                  onChange={updated => this.props.onUpdateElement(
                    updated, 
                    idx, 
                    this.props.searchResultCount > 0 ? this.props.updateSearchResult : null
                  )}
                  onRemove={() => this.handleDeleteElements([idx])}
                  isSelected={selected.has(idx)}
                  onSelect={() => {
                    const isSelected = Boolean(selected.get(idx))

                    const selectElement = cloneMap(selected)
                    if (isSelected) {
                      selectElement.delete(idx)
                    } else {
                      selectElement.set(idx, true)
                    }

                    return this.setState({
                      selected: selectElement,
                    })
                  }}
                />
              )
            })
          }

          <AddObjectRow
            type={this.props.type}
            // elementCount={elementCount+1}
            reqFields={reqFields}
            onAddElement={this.props.onAddElement}
            reqFieldsErrorAlert={this.reqFieldsErrorAlert}
            isHighlightingAnyRow={this.state.isHighlightingAnyRow}
            isHighlightingStateChanger={this.isHighlightingStateChanger}
          // rowsPerPage={this.props.defaultRowsPerPage}
          // handleAddPageChange={this.handleAddPageChange}
          />
        </BaseTable>
      </Paper>
    );
  }
}

const toolbarDefault = glamor.css({
  justifyContent: 'space-between',
})
const toolbarSelected = glamor.css({
  background: '#f5015622',
})

const BasicToolbar = props => (
  <Toolbar className={`${toolbarDefault}`}>
    <SchemaPopover schema={props.schema}>
      <Div display="inline-flex" alignItems="center" cursor="default">
        <Div marginRight="5px">
          <Typography>
            {
              props.advListName
              && (
                <>
                  <strong>{props.advListName}</strong>
                  &nbsp;-&nbsp;
                </>
              )
            }
            {
              props.fieldKey
              && (
                <>
                  <strong>{props.fieldKey}</strong>
                  &nbsp;-&nbsp;
                </>
              )
            }
            {props.title}
          </Typography>
        </Div>
        <InfoOutlined style={{ fontSize: '1em' }} />
        {
          props.totalElements !== null
          && props.totalElements !== undefined
          && props.totalElements >= 0
          && (
            <>
              &nbsp;&nbsp;&nbsp;&nbsp;
              Total:
              &nbsp;
              <strong>{props.totalElements}</strong>
            </>
          )
        }
        {
          props.searchedQuery !== ''
          && props.searchResultCount >= 0
          && (
            <>
              &nbsp;&nbsp;&nbsp;&nbsp;
              Found&nbsp;
              <strong>{props.searchResultCount}</strong>
              &nbsp;results for search query:&nbsp;
              <em>{`{ ${props.searchedQuery} }`}</em>
            </>
          )
        }

        {
          props.errorMsg
          && (
            <strong style={{ color: 'crimson' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {props.errorMsg}
              &nbsp;&nbsp;
            </strong>
          )
        }

        {
          props.openState
          && (
            <span
              role='presentation'
              className='array-modal-close-icon'
              onClick={props.openState ? props.closeArrayModal : () => { }}
            >
              <HighlightOff />
            </span>
          )
        }
      </Div>
    </SchemaPopover>
  </Toolbar>
)
BasicToolbar.displayName = 'BasicToolbar'
BasicToolbar.propTypes = {
  schema: Props.Schema.isRequired,
  title: PropTypes.node.isRequired,
}

const ArrayToolbar = props => {
  if (props.size === 0) {
    return (
      <BasicToolbar
        schema={props.schema}
        title="Array"
        fieldKey={props.fieldKey}
        errorMsg={props.errorMsg}
        openState={props.openState}
        advListName={props.advListName}
        totalElements={props.totalElements}
        searchedQuery={props.searchedQuery}
        closeArrayModal={props.closeArrayModal}
        searchResultCount={props.searchResultCount}
      />
    )
  }

  return (
    <Toolbar className={`${toolbarDefault} ${toolbarSelected}`}>
      <Typography variant="subtitle1">{`${props.size} selected`}</Typography>
      <IconButton color="default" aria-label="Delete selected elements" onClick={props.onDeleteAll}>
        <Delete />
      </IconButton>
    </Toolbar>
  )
}
ArrayToolbar.displayName = 'ArrayToolbar'
ArrayToolbar.propTypes = {
  size: PropTypes.number.isRequired,
  onDeleteAll: PropTypes.func.isRequired,
  schema: Props.Schema.isRequired,
}

// A tabular editor for editing a single JSON object
// eslint-disable-next-line react/prefer-stateless-function
class ObjectEditor extends React.Component {
  static displayName = 'ObjectEditor';

  static propTypes = {
    ...BASE_EDITOR_PROPTYPES,

    // The thing to edit. Can be either
    // * an object, string, or number with shape specified in type
    // * undefined
    object: PropTypes.oneOfType([
      PropTypes.object, PropTypes.number, PropTypes.string, PropTypes.bool,
    ]),

    // Handler called when the object is updated
    // function onUpdateElement (updatedObject) -> void
    // updatedObject is the current object with updates applied
    onUpdateElement: PropTypes.func.isRequired,

    // Optimize performance by only creating DOM if the parent is visible
    parentVisible: PropTypes.bool,

    className: PropTypes.string,
  };

  static defaultProps = {
    className: '',
  };

  render() {
    const editorTitle = typeof this.props.type === 'object'
      ? 'Object'
      : capitalize(getSchemaTypeIdentifier(this.props.type))

    return (
      <Paper>
        <BasicToolbar schema={this.props.type} title={editorTitle} advListName={this.props.advListName} totalElements={this.props.totalElements} />
        <BaseTable
          type={this.props.type}
          className={cx(BaseClassnames.Editor('--object'), this.props.className)}
        >
          {/* Object is just an individual object, so there's only one row */}
          <ElementRow
            parentVisible={this.props.parentVisible}
            className={BaseClassnames.ElementRow('--object')}
            trash={empty /* no trash button for single objects */}
            type={this.props.type}
            object={this.props.object}
            onChange={this.props.onUpdateElement}
            onRemove={empty /* Can't remove a single object */}
          />
        </BaseTable>
      </Paper>
    );
  }
}

// Component of search fields row
class SearchObjectRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      object: null
    };
  }

  updateObject = updated => {
    this.setState({
      object: updated
    });
  };

  clearButton = () => (
    <Button color="primary" onClick={this.clearButtonAction}>
      CLEAR
    </Button>
  )

  clearButtonAction = () => {
    if (this.state.object !== null) {
      this.setState({
        object: {}
      }, () => {
        this.callbackSearchRow();
      })
    }
  }

  callbackSearchRow = () => {
    this.props.SearchCallback(this.state.object)
  }

  render() {
    return (
      <ElementRow
        className="search_fields_row"
        type={this.props.type}
        trash={this.clearButton}
        object={this.state.object}
        onChange={this.updateObject}
        onRemove={empty /* unused by this component */}
        callbackSearchRow={this.callbackSearchRow}
        searchRow
      />
    )
  }
}

// A table row for adding a new element to an array
// TODO: error handling, validation
// TODO: support empty values for certain types
class AddObjectRow extends React.Component {
  static displayName = 'AddObjectRow';

  static propTypes = {
    // The schema to to use for creating new element
    type: Props.Schema.isRequired,

    // Handler called when a new element is added
    // If this function returns anything truthy, the object row is cleared (so a new object can be added).
    // If this function returns anything falsey, the object row will not be cleared.
    //
    // function onAddElement (newElement: Object) -> boolean
    onAddElement: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      // Initialize with empty object
      object: null,
    };
  }

  validations = (valueObj) => {
    let count = 0;

    Object.keys(this.props.reqFields).map(item => {
      if (item in valueObj) count += 1;
      return null;
    })

    return count === Object.keys(this.props.reqFields).length;
  }

  // Handler called when the "add" button is clicked
  // Only pass to consumer if state is non-null -- user needs to enter something
  // before they can add additional elements.
  add = () => {
    // Nothing entered in fields yet
    if (this.state.object === null) {
      return;
    }

    // const {elementCount, rowsPerPage} = this.props;

    // let lastPage = (elementCount % rowsPerPage === 0) 
    //   ? Math.floor(elementCount / rowsPerPage) - 1
    //   : Math.floor(elementCount / rowsPerPage)

    // this.props.handleAddPageChange(lastPage);

    if (this.validations(this.state.object)) {
      this.props.reqFieldsErrorAlert('');
      const result = this.props.onAddElement(this.state.object);

      // If consumer returned true, reset fields.
      if (result) {
        this.setState({
          object: null,
        });
      }
    } else {
      this.props.reqFieldsErrorAlert('Fill all the required fields');
    }
  };

  // Renders the "add element" button
  addButton = () => {
    return (
      <Button color="primary" onClick={this.add}>
        Add
        <Add />
      </Button>
    )
  };

  // Handler for updates to the object in state.
  // Simply sets object equal to the update.
  updateObject = updated => {
    this.setState({
      object: updated
    });
  };

  render() {
    const rowClasses = cx(BaseClassnames.AddObjectRow());
    return (
      <ElementRow
        className={rowClasses}
        type={this.props.type}
        trash={this.addButton}
        disablingElement={false}
        object={this.state.object}
        onChange={this.updateObject}
        onRemove={empty /* unused by this component */}
        isHighlightingAnyRow={this.props.isHighlightingAnyRow}
        isHighlightingStateChanger={this.props.isHighlightingStateChanger}
      />
    );
  }
}

// A td cell for editing a property whose type is anything but 'object'
class StringCell extends React.Component {
  static displayName = 'StringCell';

  static propTypes = {
    // The type of this cell
    type: Props.Schema.isRequired,

    // Current value of this cell
    value: PropTypes.any,

    // Handler called when the value is modified
    onChange: PropTypes.func.isRequired,
  };

  KeyPressed = (event) => {
    if (event.key === 'Enter' && this.props.searchRow) {
      this.props.callbackSearchRow()
    }
  }

  render() {
    const inputClasses = cx(
      'form-control',
      BaseClassnames.EditorInput(),
      BaseClassnames.EditorInput('--value')
    );

    let modifiedValue = null
    // eslint-disable-next-line no-restricted-globals
    if (this.props.type._type === 'number') modifiedValue = isNaN(parseFloat(this.props.value)) ? '' : parseFloat(this.props.value)
    else modifiedValue = this.props.value || ''

    return (
      <TableCell className={BaseClassnames.Cell('--value')}>
        <input
          className={inputClasses}
          type={this.props.type._type}
          value={modifiedValue}
          required={this.props.type.required}
          onKeyPress={this.KeyPressed}
          disabled={this.props.disablingElement ? this.props.type.disabled : false}
          placeholder={this.props.searchRow ? `Search${this.props.placeholderText ? ` ${this.props.placeholderText}` : ''}` : ''}
          onChange={evt => this.props.onChange(this.props.type._type === 'number' ? parseFloat(evt.target.value) : evt.target.value)}
        />
      </TableCell>
    );
  }
}

// Converts a string to a boolean, using the following rules:
//    if the input is equal to the string 'true' (case insensitive), return true
//    otherwise return false
function stringToBoolean(str) {
  return str.toLowerCase() === 'true'
}

// A td cell for editing a property whose type is boolean
// eslint-disable-next-line react/prefer-stateless-function
class BooleanCell extends React.Component {
  static displayName = 'BooleanCell';

  static propTypes = {
    // The type of this cell
    type: Props.Schema.isRequired,

    // Current value of this cell
    value: PropTypes.any,

    // Handler called when the value is modified
    onChange: PropTypes.func.isRequired,
  };

  render() {
    return (
      <TableCell className={BaseClassnames.Cell('--value')}>
        <Select
          native
          value={String(Boolean(this.props.value))}
          disabled={this.props.disablingElement ? this.props.type.disabled : false}
          onChange={evt => this.props.onChange(stringToBoolean(evt.target.value))}
        >
          <option value>True</option>
          <option value={false}>False</option>
        </Select>
      </TableCell>
    );
  }
}

// A td cell for editing a property of type `object`
// This cell will spawn nested editors using the scrimmed Editors
class ObjectCell extends React.Component {
  static displayName = 'ObjectCell';

  static propTypes = {
    // The type of this cell
    type: Props.Schema.isRequired,

    // Current value of this cell
    value: PropTypes.any,

    // Handler called when the value is modified
    onChange: PropTypes.func.isRequired,

    // Optimize performance by only creating DOM if the parent is visible
    parentVisible: PropTypes.bool,
  };

  state = {
    open: false
  };

  // Performance: prevent re-renders of the nested editors unless
  // the value changes or the editor is toggled open/closed.
  // Note: the component is ridiculously slow if the nested editors need
  // to be re-rendered.
  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.value !== nextProps.value
      || this.state.open !== nextState.open
      || this.props.parentVisible !== nextProps.parentVisible
      || this.props.isHighlightingAnyRow !== nextProps.isHighlightingAnyRow
    )
  }

  // Toggle open the editor when the edit button is clicked.
  clickEdit = () => {
    this.props.hightLightRowHandler(this.props.rowNumber)
    this.setState(prevState => ({
      open: !prevState.open
    }));
  };

  // Close the editor
  close = () => {
    this.props.hightLightRowHandler(0)
    this.setState({
      open: false,
    });
  };

  // Conditionally renders the value editor (depending on whether
  // the cell is toggled open)
  // TODO: too many conditionals here -- separate into different Cell classes
  renderEditor = () => {
    // Whether or not to use an Array editor
    const useArrayEditor = (
      // Use an array editor if the SchemaType is one of the array variants (array or arrayOf)
      (this.props.type._type && this.props.type._type.match(/array/) !== null)

      // Also use one if the value is an array
      || Array.isArray(this.props.value)
    );

    // The Editor component to use
    const Editor = useArrayEditor
      ? ArrayEditor
      : ObjectEditor

    // The type to pass to the editor -- if it's an object editor, that's just the current type.
    // If it's an array editor, we need to use the array's type.
    const editorType = useArrayEditor
      // If we're using an array editor, use the types's own _elementType or allow any
      ? this.props.type._elementType || Schema.SchemaTypes.any

      // Otherwise use the existing type
      : this.props.type;

    // The value to use for array operations -- allows us to have an empty value.
    const arrayValue = this.props.value || [];

    // Cell is open -- render the value editor

    // TODO: pull these update/add/remove handlers out of the render func
    // TODO: separate Cells for arrays, since the onUpdateElement function sig is different
    return (
      <Editor
        parentVisible={this.state.open}
        closeArrayModal={this.close}
        className={BaseClassnames.Editor('--inside')}
        type={editorType}
        object={this.props.value}
        fieldKey={this.props.fieldKey}
        onUpdateElement={
          /* This function needs to handle array and object property updates */
          (el, updatedIndex) => {
            // Array update
            if (typeof updatedIndex !== 'undefined') {
              return this.props.onChange(
                update(
                  arrayValue,
                  {
                    [updatedIndex]: {
                      $set: el,
                    }
                  }
                )
              );
            }

            // "set" object property update
            return this.props.onChange(el);
          }
        }
        onRemoveElements={
          // Tell the consumer an element was removed
          droppedIndices => {
            const wasDroppedByIndex = keyBy(R.identity, droppedIndices)
            this.props.onChange(
              // Without mutating the array, reject the dropped index
              R.addIndex(R.reject)(
                (__, idx) => idx in wasDroppedByIndex,
                arrayValue
              )
            )
          }
        }
        onAddElement={
          (el) => {
            // Pass element to consumer
            this.props.onChange(
              [...arrayValue, el]
            );

            // Clear the nested add row
            return true;
          }
        }
      />
    );
  };

  render() {
    if (typeof this.props.parentVisible === 'boolean' && !this.props.parentVisible) {
      return null
    }

    return (
      <TableCell className={BaseClassnames.Cell('--object')}>
        <Pin
          visible={this.state.open}
          position="bottom"
          anchor="middle"
          alignment="middle"
          pinContent={this.renderEditor()}
        //  onScrimClick={this.state.open ? this.close : () => {}}
        >
          <Div position="relative" display="block">
            <IconButton
              color="default"
              aria-label="Edit value"
              onClick={this.clickEdit}
              disabled={this.props.isHighlightingAnyRow}
            >
              <Edit />
            </IconButton>
          </Div>
        </Pin>
      </TableCell>
    );
  }
}

// Render an object as a row in a table.
// The "trash" prop gets render as the furthest-right td.
const ElementRow = props => {

  const [highlightRow, setHighlightRow] = useState(false);

  const hightLightRowHandler = (id) => {
    if (id === 0) {
      setHighlightRow(false)
      props.isHighlightingStateChanger(false)
    }
    if (id === props.rowNumber) {
      setHighlightRow(true)
      props.isHighlightingStateChanger(true)
    }
  }

  // For some key, returns a handler that calls props.onChange with the
  // value of props.object[key].
  // Support null/undefined objects.
  const getChangeHandler = key => newValue => {
    // Element doesn't have a value at this key yet
    // So create an object with this key
    if (!props.object) {
      return props.onChange({
        [key]: newValue
      });
    }

    // Set key = newValue and pass to consumer
    return props.onChange(update(
      props.object,
      {
        [key]: {
          $set: newValue
        }
      }
    ));
  };

  // The trash button (if the consumer didn't specify one)
  const trashButton = (
    <IconButton color="default" aria-label="Delete element" onClick={props.onRemove}>
      <Delete />
    </IconButton>
  );

  // Render a cell based on a primitive SchemaType, a value, and a handler
  const renderCell = (primitiveType, value, handler, key) => {
    const CellType = (type => {
      switch (type) {
        case 'string':
        case 'number':
        case 'date':
          return StringCell

        case 'boolean':
          return BooleanCell

        default:
          return ObjectCell
      }
    })(primitiveType._type)

    if (props.searchRow) {
      if (
        primitiveType._type === "string"
        || primitiveType._type === "number"
        || primitiveType._type === "date"
      ) {
        return (
          <StringCell
            parentVisible={props.parentVisible}
            key={key}
            type={primitiveType}
            value={value}
            onChange={handler}
            searchRow={props.searchRow}
            placeholderText={key}
            callbackSearchRow={props.callbackSearchRow}
          />
        )
      }
      return <TableCell key={key} />
    }

    return (
      <CellType
        parentVisible={props.parentVisible}
        key={key}
        type={primitiveType}
        value={value}
        fieldKey={key}
        onChange={handler}
        rowNumber={props.rowNumber}
        disablingElement={props.disablingElement}
        hightLightRowHandler={hightLightRowHandler}
        isHighlightingAnyRow={props.isHighlightingAnyRow}
      />
    )
  };

  // If props.type is a primitive (i.e. type._isSchemaType is true), we just render a single td
  // based on props.type.
  // If props.type is an object, we render td:s for each key in the object.
  const renderElementBody = () => {
    // Primitive case
    if (props.type._isSchemaType) {
      return renderCell(
        // Just use the type directly
        props.type,

        // Use the object directly
        props.object || null,

        // The change handler just returns the new value directly
        props.onChange
      );
    }

    // Object case
    return R.map(
      key => {
        const value = props.object
          ? props.object[key]
          : null;

        return renderCell(
          props.type[key],
          value,
          getChangeHandler(key),
          key,
        );
      },
      Object.keys(props.type)
    );
  };

  const rowClasses = cx(
    BaseClassnames.ElementRow(),
    props.className || '',
    highlightRow ? 'highlight-row' : ''
  );

  return (
    <TableRow className={rowClasses}>
      <TableCell padding="checkbox">
        <div className="firstCheckboxColumn">
          {
            props.onSelect
            && <Checkbox checked={props.isSelected} onChange={props.onSelect} />
          }
          {
            props.rowNumber && (
              <>
                &nbsp;
                <span>{props.rowNumber}</span>
              </>
            )
          }
        </div>
      </TableCell>

      {/*
              * Render the "body" of the element -- for an object, cells for each key.
              * For a primitive, a single cell.
              */}
      {renderElementBody()}

      <TableCell>
        {
          props.trash
            ? props.trash()
            : trashButton
        }
      </TableCell>
    </TableRow>
  );
};
ElementRow.displayName = 'ElementRow';
ElementRow.propTypes = {
  // The type of this field -- a SchemaType
  // type: PropTypes.SchemaType.isRequired,
  type: Props.Schema.isRequired,

  // Content for the trash button cell
  trash: PropTypes.func,

  // The element itself (should have the type `type`)
  object: PropTypes.any,

  // Handler called when the element is updated
  //
  // function onChange (updatedElement: Object) -> void
  onChange: PropTypes.func.isRequired,

  // Handler called when the user clicks the remove button
  // Called with no arguments
  //
  // function onRemove () -> void
  onRemove: PropTypes.func.isRequired,

  // Handler called when the "select multiple" checkbox is clicked.
  // If this handler isn't supplied, the checkbox isn't rendered.
  onSelect: PropTypes.func,

  // If true (and if onSelect is supplied), renders a checked Checkbox
  isSelected: PropTypes.bool,

  // Optional extra classes to add to the <tr />
  className: PropTypes.string,

  // Optimize performance by only creating DOM if the parent is visible
  parentVisible: PropTypes.bool,
};

export { ObjectEditor };
