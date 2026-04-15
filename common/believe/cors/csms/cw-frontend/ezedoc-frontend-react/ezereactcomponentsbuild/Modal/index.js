"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Modal = _interopRequireDefault(require("react-bootstrap/Modal"));

var _propTypes = _interopRequireDefault(require("prop-types"));

require("./Modal.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EzeModal = function EzeModal(_ref) {
  var show = _ref.show,
      onClose = _ref.onClose,
      title = _ref.title,
      children = _ref.children,
      className = _ref.className;
  return _react.default.createElement(_Modal.default, {
    show: show,
    onHide: onClose,
    centered: true,
    animation: true,
    className: className
  }, _react.default.createElement("div", {
    className: "reusable-modal-header"
  }, _react.default.createElement(_Modal.default.Header, null, _react.default.createElement(_Modal.default.Title, null, title))), _react.default.createElement("div", {
    className: "reusable-modal-body"
  }, _react.default.createElement(_Modal.default.Body, null, children)));
};

EzeModal.propTypes = {
  show: _propTypes.default.bool.isRequired,
  onClose: _propTypes.default.func.isRequired,
  title: _propTypes.default.string,
  children: _propTypes.default.element.isRequired,
  className: _propTypes.default.string
};
EzeModal.defaultProps = {
  title: 'Modal'
};
var _default = EzeModal;
exports.default = _default;