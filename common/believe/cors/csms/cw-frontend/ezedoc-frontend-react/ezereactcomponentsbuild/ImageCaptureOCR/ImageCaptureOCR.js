"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Dashboard = _interopRequireDefault(require("@uppy/react/lib/Dashboard"));

require("@uppy/core/dist/style.min.css");

require("@uppy/dashboard/dist/style.min.css");

var _ImageCropper = _interopRequireDefault(require("./ImageCropper"));

var _Components = require("./shared/Components");

var _DotsLoader = _interopRequireDefault(require("../Spinners/DotsLoader"));

var _SliderCheckBox = _interopRequireDefault(require("./shared/SliderCheckBox"));

var _Camera = _interopRequireDefault(require("./Camera"));

var _Utils = require("./Utils");

var _ocr_config = _interopRequireDefault(require("./ocr_config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { return function () { var Super = _getPrototypeOf(Derived), result; if (_isNativeReflectConstruct()) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ImageCaptureOCR = /*#__PURE__*/function (_React$Component) {
  _inherits(ImageCaptureOCR, _React$Component);

  var _super = _createSuper(ImageCaptureOCR);

  function ImageCaptureOCR(props) {
    var _this;

    _classCallCheck(this, ImageCaptureOCR);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "handleUpload", function (result, type) {
      if (result.successful.length && result.successful.length === 1) {
        var UploadedFile = result.successful[0];

        _this.setState(function (prevState) {
          return _objectSpread({}, prevState, {
            components: _toConsumableArray(prevState.components.map(function (component) {
              if (component.id === type) return _objectSpread({}, component, {
                file: UploadedFile.data,
                fileId: UploadedFile.id,
                cropperSrc: (0, _Utils.FileObjectToBlobUrl)(UploadedFile.data),
                upload: true,
                cropper: true
              });
              return component;
            })),
            hideUploadBtn: true
          });
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "handleUploadCancel", function (type) {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          components: _toConsumableArray(prevState.components.map(function (component) {
            if (component.id === type) {
              component.uppyInstance.reset();
              return _objectSpread({}, component, {
                file: null,
                upload: false,
                cropperSrc: "",
                cropper: false,
                previewURL: null
              });
            }

            return component;
          })),
          hideUploadBtn: false
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "setCamera", function (_ref) {
      var checked = _ref.target.checked;

      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          pendingMessage: "",
          isCamera: checked
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleCropSubmit", function (croppedFile, type) {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          components: _toConsumableArray(prevState.components.map(function (component) {
            if (component.id === type) return _objectSpread({}, component, {
              file: croppedFile,
              previewURL: (0, _Utils.FileObjectToBlobUrl)(croppedFile),
              cropper: false,
              camera: true,
              upload: true
            });
            return _objectSpread({}, component, {
              camera: true
            });
          })),
          hideUploadBtn: false
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleCaptureStart", function (type) {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          components: _toConsumableArray(prevState.components.map(function (component) {
            if (component.id !== type) {
              return _objectSpread({}, component, {
                camera: false
              });
            }

            return component;
          })),
          hideUploadBtn: true
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "setPendingStatus", function (_ref2) {
      var message = _ref2.message,
          _ref2$loader = _ref2.loader,
          loader = _ref2$loader === void 0 ? true : _ref2$loader;

      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          pendingMessage: message,
          loader: loader
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleCompleted", function (data) {
      _this.props.onSubmit(data);
    });

    _defineProperty(_assertThisInitialized(_this), "handleSubmit", function () {
      _this.setPendingStatus({
        message: "Please wait while we upload your files ... "
      });

      _ocr_config.default[_this.props.type].submit({
        files: _this.state.components.map(function (component) {
          return component.file;
        }),
        setStatus: _this.setPendingStatus,
        orgId: _this.props.orgId,
        token: _this.props.token || "token",
        openform: _this.props.openform,
        transactionId: _this.props.transactionId,
        onComplete: _this.handleCompleted
      });
    });

    _ocr_config.default[props.type].init(_this.handleUpload);

    _this.state = _objectSpread({
      hideUploadBtn: false
    }, _ocr_config.default[props.type].initialState);
    return _this;
  }

  _createClass(ImageCaptureOCR, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      try {
        _ocr_config.default[this.props.type].close();

        this.state.components.forEach(function (component) {
          URL.revokeObjectURL(component.cropperSrc);
          URL.revokeObjectURL(component.cropperSrc);
        });
      } catch (err) {
        console.log(err);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$state = this.state,
          components = _this$state.components,
          loader = _this$state.loader,
          pendingMessage = _this$state.pendingMessage,
          cameraEnabled = _this$state.cameraEnabled,
          isCamera = _this$state.isCamera,
          hideUploadBtn = _this$state.hideUploadBtn;

      var _components$filter = components.filter(function (component) {
        return component.cropper;
      }),
          _components$filter2 = _slicedToArray(_components$filter, 1),
          activeCropper = _components$filter2[0];

      var isSubmitDisabled = components.filter(function (component) {
        return !component.upload;
      }).length;
      return _react.default.createElement(_react.default.Fragment, null, _react.default.createElement("div", {
        className: "toggle-capture-switch",
        style: {
          display: cameraEnabled ? "flex" : "none"
        }
      }, _react.default.createElement("span", null, "Use Camera"), _react.default.createElement(_SliderCheckBox.default, {
        onChange: this.setCamera,
        checked: isCamera,
        name: "Use Camera"
      })), _react.default.createElement("div", {
        className: "aadhar-upload-container ".concat(!activeCropper ? "d-flex" : "")
      }, loader && _react.default.createElement(_DotsLoader.default, {
        style: {
          left: "50%",
          right: "50%"
        }
      }), _react.default.createElement("span", null, pendingMessage), isCamera ? components.map(function (component) {
        return _react.default.createElement("div", {
          key: component.id,
          style: {
            display: component.camera ? "block" : "none"
          }
        }, _react.default.createElement(_Camera.default, {
          type: component.id,
          handleSubmit: _this2.handleCropSubmit,
          handleCancel: _this2.handleUploadCancel,
          onCaptureStart: _this2.handleCaptureStart,
          displayLabel: component.name,
          previewImg: component.previewURL,
          setWebCam: function setWebCam() {
            _this2.setState({
              cameraEnabled: false,
              isCamera: false
            });
          }
        }));
      }) : _react.default.createElement(_react.default.Fragment, null, activeCropper ? _react.default.createElement(_ImageCropper.default, {
        type: activeCropper.id,
        orgId: this.props.orgId,
        transactionId: this.props.transactionId,
        src: activeCropper.cropperSrc,
        handleSubmit: this.handleCropSubmit,
        handleCancel: this.handleUploadCancel
      }) : components.map(function (component) {
        return _react.default.createElement("div", {
          key: component.id
        }, _react.default.createElement(_Components.FilePlaceHolder, {
          label: component.name,
          closeBtn: component.upload,
          onCancel: function onCancel() {
            _this2.handleUploadCancel(component.id);
          }
        }, component.upload ? _react.default.createElement(_Components.CapturePreview, {
          src: component.previewURL
        }) : _react.default.createElement(_Dashboard.default, {
          id: component.id,
          inline: true,
          allowMultipleUploads: false,
          uppy: component.uppyInstance,
          showSelectedFiles: false,
          hideUploadButton: true,
          height: "180px"
        })));
      })), !hideUploadBtn && _react.default.createElement("button", {
        disabled: isSubmitDisabled || pendingMessage,
        type: "button",
        className: "btn btn-primary center-block",
        onClick: this.handleSubmit
      }, "Upload")));
    }
  }]);

  return ImageCaptureOCR;
}(_react.default.Component);

var _default = ImageCaptureOCR;
exports.default = _default;