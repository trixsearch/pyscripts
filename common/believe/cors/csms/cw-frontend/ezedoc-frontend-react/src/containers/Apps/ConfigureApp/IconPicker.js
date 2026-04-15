import React from "react";
import EzeReactModal from "ezereactcomponents/EzeReactModal";
import { Button } from "components/UI/AppButton/AppButton";

// import Modal from "../../../components/Modal";

const icons = [
  { className: "icon-audit", name: "Audit" },
  { className: "icon-construction", name: "Construction" },
  { className: "icon-covid19", name: "Covid 19" },
  { className: "icon-employee", name: "Employee" },
  { className: "icon-hospital", name: "Hospital" },
  { className: "icon-industry", name: "Industry" },
  { className: "icon-offboarding-new", name: "Offboarding" },
  { className: "icon-office", name: "Office" },
  { className: "icon-onboarding-new", name: "Onboarding" },
  { className: "icon-profile", name: "Profile" },
  { className: "icon-salary", name: "Salary" },
  { className: "icon-school", name: "School" },
  { className: "icon-security", name: "Security" },
  { className: "icon-taxi", name: "Taxi" },
  { className: "icon-telephone", name: "Telephone" },
  { className: "icon-training", name: "Training" },
  { className: "icon-transfer-new", name: "Transfer" },
  { className: "icon-travel", name: "Travel" },
];

const modalDesktopStyles = {
  content: {
    top: "50%",
    left: "50%",
    width: "740px",
    height: "450px",
    transform: "translate(-50%, -50%)",
  },
};

class IconPicker extends React.Component {
  state = {
    iconModal: false,
    icon: "",
  };

  openIconModal = () => {
    this.setState({ iconModal: true });
  };

  closeIconModal = () => {
    this.setState({ iconModal: false });
  };

  selectIcon = (event) => {
    this.setState({ icon: Object.values(event.target)[1].name });
  }

  handleSave = () => {
    this.setState({ iconModal: false });
    this.props.selectWorkflow(this.state.icon);
  };

  render() {
    return (
      <>
        <button
          className="fancy_btn active"
          style={{
            marginLeft: 4,
            marginTop: 3,
            paddingLeft: 0,
            paddingRight: 0,
          }}
          type="button"
          onClick={this.openIconModal}
        >
          Select Workflow Icon
        </button>
        <EzeReactModal
          closeModal={this.closeIconModal}
          modalIsOpen={this.state.iconModal}
          desktopStyles={modalDesktopStyles}
        >
          <div>
              <h3 style={{textAlign: 'center', marginTop: 0}}>Choose Workflow Icon</h3>
            <div className="icons-picker">
              {icons.map((icon, index) => (
                <button
                  type="button"
                  className="icons-item iconPicker-button"
                  name={icon.className}
                  key={`icon__${index + 1}`}
                  onClick={this.selectIcon}
                >
                  <span
                    role="presentation"
                    name={icon.className}
                    className={`${icon.className} iconPicker-icon`}
                  />
                  <span className="icons-name">{icon.name}</span>
                </button>
              ))}
            </div>
            <div className="icons-picker-actions-cont">
                <Button 
                    variant="secondary"
                    onClick={this.closeIconModal}
                >
                    Cancel
                </Button>
                <Button 
                    variant="primary"
                    onClick={this.handleSave}
                >
                    Select
                </Button>
            </div>
          </div>
        </EzeReactModal>
      </>
    );
  }
}

export default IconPicker;
