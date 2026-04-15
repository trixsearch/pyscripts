"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _loader_white = _interopRequireDefault(require("../../Assets/loader_white.gif"));

require("./Spinner.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var Spinner = function Spinner() {
  var _document, _document$getElementB, _document$getElementB2, _document2, _document2$getElement, _document2$getElement2, _document7, _document7$getElement, _document7$getElement2, _document8, _document8$getElement, _document8$getElement2;

  var _useState = (0, _react.useState)(window.innerWidth - ((_document = document) === null || _document === void 0 ? void 0 : (_document$getElementB = _document.getElementById("ezedox_main_container")) === null || _document$getElementB === void 0 ? void 0 : (_document$getElementB2 = _document$getElementB.getBoundingClientRect()) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.width)),
      _useState2 = _slicedToArray(_useState, 2),
      left = _useState2[0],
      setLeft = _useState2[1];

  var _useState3 = (0, _react.useState)((_document2 = document) === null || _document2 === void 0 ? void 0 : (_document2$getElement = _document2.getElementById("Header_container")) === null || _document2$getElement === void 0 ? void 0 : (_document2$getElement2 = _document2$getElement.getBoundingClientRect()) === null || _document2$getElement2 === void 0 ? void 0 : _document2$getElement2.height),
      _useState4 = _slicedToArray(_useState3, 2),
      top = _useState4[0],
      setTop = _useState4[1];

  (0, _react.useEffect)(function () {
    var _document5, _document5$getElement, _document6, _document6$getElement;

    var resizeListener = function resizeListener(ev) {
      var _document3, _document3$getElement, _document3$getElement2;

      setLeft(window.innerWidth - ((_document3 = document) === null || _document3 === void 0 ? void 0 : (_document3$getElement = _document3.getElementById("ezedox_main_container")) === null || _document3$getElement === void 0 ? void 0 : (_document3$getElement2 = _document3$getElement.getBoundingClientRect()) === null || _document3$getElement2 === void 0 ? void 0 : _document3$getElement2.width));
    };

    var heightResizeListener = function heightResizeListener(ev) {
      var _document4, _document4$getElement, _document4$getElement2;

      setTop((_document4 = document) === null || _document4 === void 0 ? void 0 : (_document4$getElement = _document4.getElementById("Header_container")) === null || _document4$getElement === void 0 ? void 0 : (_document4$getElement2 = _document4$getElement.getBoundingClientRect()) === null || _document4$getElement2 === void 0 ? void 0 : _document4$getElement2.height);
    };

    (_document5 = document) === null || _document5 === void 0 ? void 0 : (_document5$getElement = _document5.getElementById("ezedox_main_container")) === null || _document5$getElement === void 0 ? void 0 : _document5$getElement.addEventListener("resize", resizeListener);
    (_document6 = document) === null || _document6 === void 0 ? void 0 : (_document6$getElement = _document6.getElementById("Header_container")) === null || _document6$getElement === void 0 ? void 0 : _document6$getElement.addEventListener("resize", heightResizeListener);
    return function () {
      document.getElementById("ezedox_main_container").removeEventListener("resize", resizeListener);
      document.getElementById("Header_container").removeEventListener("resize", heightResizeListener);
    };
  }, []);
  return _react.default.createElement("div", {
    id: "spinner_loader",
    className: "busy_loader",
    style: {
      left: left + "px",
      top: top - 16 + "px",
      width: (_document7 = document) === null || _document7 === void 0 ? void 0 : (_document7$getElement = _document7.getElementById("ezedox_main_container")) === null || _document7$getElement === void 0 ? void 0 : (_document7$getElement2 = _document7$getElement.getBoundingClientRect()) === null || _document7$getElement2 === void 0 ? void 0 : _document7$getElement2.width,
      height: window.innerHeight - ((_document8 = document) === null || _document8 === void 0 ? void 0 : (_document8$getElement = _document8.getElementById("Header_container")) === null || _document8$getElement === void 0 ? void 0 : (_document8$getElement2 = _document8$getElement.getBoundingClientRect()) === null || _document8$getElement2 === void 0 ? void 0 : _document8$getElement2.height)
    }
  }, _react.default.createElement("img", {
    src: _loader_white.default,
    alt: ""
  }));
};

var _default = Spinner;
exports.default = _default;