"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _info_logo = _interopRequireDefault(require("../Assets/info_logo.svg"));

var _toastWarning = _interopRequireDefault(require("../Assets/toast-warning.svg"));

var _toastError = _interopRequireDefault(require("../Assets/toast-error.svg"));

var _toastSuccess = _interopRequireDefault(require("../Assets/toast-success.svg"));

require("./index.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ToasterComponent = function ToasterComponent(_ref) {
  var toast = _ref.toast,
      removeToast = _ref.removeToast;
  var toastIcon;

  switch (toast.type) {
    case 'success':
      toastIcon = _toastSuccess.default;
      break;

    case 'info':
      toastIcon = _info_logo.default;
      break;

    case 'error':
      toastIcon = _toastError.default;
      break;

    case 'warning':
      toastIcon = _toastWarning.default;
      break;

    default:
      break;
  }

  return _react.default.createElement("div", {
    key: toast.id,
    role: "presentation",
    onClick: function onClick() {
      return removeToast(toast.id);
    },
    className: "toast ".concat(toast.type, "_toast fade-in")
  }, _react.default.createElement("img", {
    className: "".concat(toast.type, "_icon"),
    src: toastIcon,
    alt: "".concat(toast.type, " icon")
  }), _react.default.createElement("div", {
    className: "".concat(toast.type, "_text")
  }, _react.default.createElement("strong", null, toast.title), _react.default.createElement("br", null), toast.message, toast.refresh ? _react.default.createElement(_react.default.Fragment, null, _react.default.createElement("br", null), _react.default.createElement("span", {
    role: "presentation",
    className: "refresh_toast",
    onClick: function onClick() {
      return toast.refreshFunc();
    }
  }, "Click here to refresh")) : null));
};

var _default = ToasterComponent;
exports.default = _default;