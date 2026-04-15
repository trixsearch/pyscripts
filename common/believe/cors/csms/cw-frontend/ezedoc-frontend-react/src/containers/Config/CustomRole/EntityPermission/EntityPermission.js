import React, { Component } from "react";
import Spinner from "../../../../components/UI/Spinner/Spinner";
import {
  CheckBox,
  MainContainer,
  HeaderComponent,
  HeaderItem,
  BodyComponent,
  Save,
  ContainerBox
} from "../components";

import "../../../Tasks/task.css";
import "../CustomRole.css";

class EntityPermission extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { editDisabled, entity_data, loader } = this.props;
    return (
      <div className="entityPermissionPage">
        {loader && <Spinner />}
        <MainContainer>
          <HeaderComponent>
            <HeaderItem name="Entity" />
            <HeaderItem name="View" />
            <HeaderItem name="BulkUpdate" />
          </HeaderComponent>
          <BodyComponent>
            {entity_data.data &&
              entity_data.data.map((entity, index) => {
                return (
                  <ContainerBox entity={entity}>
                    <CheckBox
                      name="View"
                      checked={entity.permissions.View}
                      clicked={e => this.props.updateEntity(e, index)}
                      disabled={editDisabled}
                    />
                    <CheckBox
                      name="BulkUpdate"
                      checked={entity.permissions.BulkUpdate}
                      clicked={e => this.props.updateEntity(e, index)}
                      disabled={editDisabled}
                    />
                  </ContainerBox>
                );
              })}
          </BodyComponent>
        </MainContainer>    
        <Save  
          updatePermission={() => this.props.updatePermission(entity_data)}
          editDisabled={entity_data && entity_data['disabled']}
        />
      </div>
    );
  }
}

export default EntityPermission;