"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Icon = exports.Button = exports.AddFileIcon = exports.FilePlaceHolder = exports.CapturePreview = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var CapturePreview = function CapturePreview(_ref) {
  var src = _ref.src,
      _ref$height = _ref.height,
      height = _ref$height === void 0 ? 160 : _ref$height;
  return _react.default.createElement("img", {
    src: src,
    alt: "",
    height: height,
    className: "captured-img-preview"
  });
};

exports.CapturePreview = CapturePreview;

var FilePlaceHolder = function FilePlaceHolder(props) {
  return _react.default.createElement("div", {
    className: "file-placeholder-box"
  }, _react.default.createElement("button", {
    className: "close-btn",
    type: "button",
    onClick: props.onCancel,
    style: {
      display: props.closeBtn ? "block" : "none"
    }
  }, "\xD7"), props.children, _react.default.createElement("h5", {
    className: "text-center"
  }, props.label));
};

exports.FilePlaceHolder = FilePlaceHolder;

var AddFileIcon = function AddFileIcon(props) {
  return _react.default.createElement("button", {
    type: "button",
    className: "file-upload-plus-circle-cont",
    onClick: props.onClick
  });
};

exports.AddFileIcon = AddFileIcon;

var Button = function Button(_ref2) {
  var id = _ref2.id,
      className = _ref2.className,
      style = _ref2.style,
      onClick = _ref2.onClick,
      children = _ref2.children,
      props = _objectWithoutProperties(_ref2, ["id", "className", "style", "onClick", "children"]);

  return _react.default.createElement("div", {
    className: "btn-group",
    style: {
      height: "100%"
    }
  }, _react.default.createElement("button", _extends({
    id: id || "",
    className: className,
    style: style,
    onClick: onClick,
    type: "button"
  }, props), children));
};

exports.Button = Button;

var Icon = function Icon(_ref3) {
  var className = _ref3.className,
      style = _ref3.style;
  return _react.default.createElement("span", {
    className: className,
    style: style
  });
};

exports.Icon = Icon;