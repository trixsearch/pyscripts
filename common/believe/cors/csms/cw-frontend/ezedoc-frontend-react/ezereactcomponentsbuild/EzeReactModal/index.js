"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactModal = _interopRequireDefault(require("react-modal"));

require("./EzeReactModal.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultMobileStyles = {
  // Full screen modal on mobile
  content: {
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    padding: '5px'
  }
};
var defaultDesktopStyles = {
  // 600 x 400 pixels modal on desktop
  content: {
    top: '50%',
    left: '50%',
    width: '600px',
    height: '400px',
    transform: 'translate(-50%, -50%)'
  }
};

var EzeReactModal = function EzeReactModal(_ref) {
  var children = _ref.children,
      closeModal = _ref.closeModal,
      modalIsOpen = _ref.modalIsOpen,
      mobileStyles = _ref.mobileStyles,
      desktopStyles = _ref.desktopStyles,
      afterOpenModal = _ref.afterOpenModal;
  return _react.default.createElement(_reactModal.default, {
    ariaHideApp: false,
    isOpen: modalIsOpen,
    onRequestClose: closeModal,
    onAfterOpen: afterOpenModal,
    contentLabel: "EzeReactModal",
    style: window.innerWidth > 576 ? desktopStyles : mobileStyles
  }, _react.default.createElement("div", {
    className: "eze_react_modal_container"
  }, _react.default.createElement("span", {
    className: "closeButton fa fa-times-circle-o",
    onClick: closeModal
  }), _react.default.createElement("div", {
    className: "eze_react_modal_children_wrapper"
  }, children)));
};

EzeReactModal.propTypes = {
  mobileStyles: _propTypes.default.object,
  desktopStyles: _propTypes.default.object,
  closeModal: _propTypes.default.func.isRequired,
  modalIsOpen: _propTypes.default.bool.isRequired,
  children: _propTypes.default.element.isRequired,
  afterOpenModal: _propTypes.default.func
};
EzeReactModal.defaultProps = {
  modalIsOpen: false,
  mobileStyles: defaultMobileStyles,
  desktopStyles: defaultDesktopStyles
};
var _default = EzeReactModal;
exports.default = _default;