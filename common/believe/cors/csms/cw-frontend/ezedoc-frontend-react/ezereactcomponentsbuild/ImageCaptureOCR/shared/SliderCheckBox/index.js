"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// import "./SliderCheckbox.css";
var SliderCheckbox = function SliderCheckbox(_ref) {
  var checked = _ref.checked,
      name = _ref.name,
      onChange = _ref.onChange,
      props = _objectWithoutProperties(_ref, ["checked", "name", "onChange"]);

  return _react.default.createElement("div", {
    className: "checkbox checkbox-slider--b-flat"
  }, _react.default.createElement("label", null, _react.default.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    name: name,
    onChange: onChange
  }, props)), _react.default.createElement("span", null)));
};

var _default = SliderCheckbox;
exports.default = _default;