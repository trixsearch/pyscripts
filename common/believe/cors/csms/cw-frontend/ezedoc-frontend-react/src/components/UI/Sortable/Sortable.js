import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import './Sortable.css';

const cardStyle = (color) => ({
  color: color,
  border: `1px solid ${color}`
});

const cardIndexStyle = (color) => ({
  color: color,
  borderRight: `1px solid ${color}`
});

const getItemStyle = (draggableStyle) => ({
  padding: 5,
  userSelect: "none",
  margin: "0 10px 0 0",
  ...draggableStyle
});

const getListStyle = () => ({
  width: "100%",
  display: "flex",
  overflowX: "auto",
  paddingBottom: 10
});

const Sortable = (props) => {
  let { selectedOptions, onDragEnd, cardColor} = props;
  return (
    <div className={`sortable ${selectedOptions.length > 0 ? 'well' : ''}`}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              style={getListStyle()}
              {...provided.droppableProps}
            >
              {selectedOptions.map((value, index) => (
                <Draggable
                  key={`item__${index + 1}`}
                  draggableId={index + 1}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(
                        provided.draggableProps.style
                      )}
                    >
                      <div className="card label" style={cardColor ? cardStyle(cardColor) : {}}>
                          <span style={cardColor ? cardIndexStyle(cardColor) : {}}>{index + 1}</span>
                        {value}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default Sortable;
