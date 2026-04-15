"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _MediaRecorder = _interopRequireDefault(require("./MediaRecorder"));

var _EzeReactModal = _interopRequireDefault(require("../EzeReactModal"));

var _switchCamera = _interopRequireDefault(require("../Assets/switch-camera.svg"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var FRONT_CAMERA = "user";
var BACK_CAMERA = "environment";

var EzeReactMediaRecorder = function EzeReactMediaRecorder(_ref) {
  var delayInSec = _ref.delayInSec,
      _ref$durationInSec = _ref.durationInSec,
      durationInSec = _ref$durationInSec === void 0 ? 0 : _ref$durationInSec,
      props = _objectWithoutProperties(_ref, ["delayInSec", "durationInSec"]);

  var _useState = (0, _react.useState)(FRONT_CAMERA),
      _useState2 = _slicedToArray(_useState, 2),
      device = _useState2[0],
      setDevice = _useState2[1];

  var _useState3 = (0, _react.useState)(true),
      _useState4 = _slicedToArray(_useState3, 2),
      showCamSwitch = _useState4[0],
      setCamSwitch = _useState4[1];

  var constraints = {
    audio: true,
    video: {
      facingMode: {
        ideal: device
      }
    }
  };
  var cameraSwitch = showCamSwitch ? _react.default.createElement("button", {
    type: "button",
    className: "cameraSwitch",
    onClick: function onClick() {
      if (device === FRONT_CAMERA) {
        setDevice(BACK_CAMERA);
      } else {
        setDevice(FRONT_CAMERA);
      }
    }
  }, _react.default.createElement("img", {
    src: _switchCamera.default,
    alt: "Camera Switch"
  })) : null;
  return _react.default.createElement(_EzeReactModal.default, {
    modalIsOpen: true,
    closeModal: props.onClose
  }, _react.default.createElement(_MediaRecorder.default, _extends({
    key: device,
    constraints: constraints,
    durationInSec: durationInSec,
    recordDelayMs: delayInSec * 1000 // The library component, records for a second less than given duration
    // as a workaround this issue, we add 1 second.
    ,
    recordTimerMs: (durationInSec + 1) * 1000,
    mediaConstraints: constraints,
    cameraSwitch: cameraSwitch,
    setCamSwitch: setCamSwitch
  }, props)));
};

var _default = EzeReactMediaRecorder;
exports.default = _default;