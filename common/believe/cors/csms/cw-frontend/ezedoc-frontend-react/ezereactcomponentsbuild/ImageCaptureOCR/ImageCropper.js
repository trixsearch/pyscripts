"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactCropper = _interopRequireDefault(require("react-cropper"));

require("cropperjs/dist/cropper.css");

var _Utils = require("./Utils");

var _Components = require("./shared/Components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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

var ImageCropper = /*#__PURE__*/function (_React$Component) {
  _inherits(ImageCropper, _React$Component);

  var _super = _createSuper(ImageCropper);

  function ImageCropper(props) {
    var _this;

    _classCallCheck(this, ImageCropper);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "handleSelect", function (_ref) {
      var value = _ref.target.value;

      _this.setState({
        aspRatio: Number(value)
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleLeft", function () {
      _this.cropper.current.rotate(-90);
    });

    _defineProperty(_assertThisInitialized(_this), "handleRight", function () {
      _this.cropper.current.rotate(90);
    });

    _defineProperty(_assertThisInitialized(_this), "setPreview", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (_this.cropper.current) {
                _this.setState(function (prevState) {
                  return {
                    preview: _this.cropper.current.getCroppedCanvas().toDataURL(prevState.fileType, prevState.quality)
                  };
                });
              }

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })));

    _defineProperty(_assertThisInitialized(_this), "handleReset", function () {
      _this.setState({
        preview: ""
      });

      if (_this.cropper.current) {
        _this.cropper.current.reset();
      }
    });

    _defineProperty(_assertThisInitialized(_this), "handleSubmit", function () {
      _this.setState({
        loader: true
      });

      var _this$state = _this.state,
          fileType = _this$state.fileType,
          quality = _this$state.quality;
      (0, _Utils.base64ToBlob)(_this.cropper.current.getCroppedCanvas().toDataURL(fileType, quality)).then(function (res) {
        _this.setState({
          loader: false
        });

        _this.props.handleSubmit(res, _this.props.type);
      });
    });

    _this.cropper = _react.default.createRef();
    _this.previewRef = _react.default.createRef();
    _this.state = {
      aspRatio: 16 / 10,
      aspRatioOptions: [],
      loader: false,
      preview: "",
      fileType: "image/jpeg",
      quality: 0.9
    };
    return _this;
  }

  _createClass(ImageCropper, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.cropper.current.clear();
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$state2 = this.state,
          loader = _this$state2.loader,
          preview = _this$state2.preview,
          aspRatio = _this$state2.aspRatio,
          aspRatioOptions = _this$state2.aspRatioOptions;
      return _react.default.createElement("div", {
        style: {
          maxWidth: '100%',
          width: '100%'
        }
      }, loader && _react.default.createElement("h1", null, "Loading .  .  ."), _react.default.createElement("div", {
        style: {
          display: preview ? "block" : "none"
        },
        className: "cropd-img-preview-cont"
      }, _react.default.createElement("img", {
        height: "400",
        src: preview,
        alt: ""
      })), _react.default.createElement(_reactCropper.default, {
        src: this.props.src,
        style: {
          height: 400,
          width: "100%",
          display: preview || loader ? "none" : "block"
        } // Cropper.js options
        ,
        aspectRatio: aspRatio,
        checkOrientation: true,
        rotatable: true,
        background: true,
        viewMode: 2,
        dragMode: "move",
        cropBoxMovable: true,
        onInitialized: function onInitialized(insatnce) {
          _this2.cropper.current = insatnce;
        }
      }), _react.default.createElement("div", {
        className: "preview-controls-container",
        style: {
          display: preview ? "flex" : "none",
          justifyContent: 'space-around'
        }
      }, _react.default.createElement(_Components.Button, {
        onClick: function onClick() {
          _this2.setState({
            preview: ""
          });
        },
        className: "btn btn-danger"
      }, "Go Back", _react.default.createElement(_Components.Icon, {
        className: "glyphicon glyphicon-remove"
      })), _react.default.createElement(_Components.Button, {
        id: "submit-croppped-img-btn",
        className: "btn btn-success",
        onClick: this.handleSubmit
      }, _react.default.createElement(_Components.Icon, {
        className: "glyphicon glyphicon-ok"
      }), "Submit")), _react.default.createElement("div", {
        className: "crop-controls-container",
        style: {
          display: preview ? "none" : "flex",
          justifyContent: 'space-evenly'
        }
      }, aspRatioOptions.length > 1 && _react.default.createElement("div", {
        className: "input-group mb-3",
        style: {
          maxWidth: "33%",
          display: "flex",
          justifyContent: 'space-evenly'
        }
      }, _react.default.createElement("select", {
        onChange: this.handleSelect,
        defaultValue: aspRatioOptions[0].value.toString(),
        className: "custom-select"
      }, aspRatioOptions.map(function (option, index) {
        return _react.default.createElement("option", {
          key: "".concat(index + 1, "-crop-option"),
          value: option.value.toString()
        }, option.name);
      }))), _react.default.createElement(_Components.Button, {
        id: "crop-cancel",
        onClick: function onClick() {
          _this2.cropper.current.reset();

          _this2.props.handleCancel(_this2.props.type, false);
        },
        className: "btn btn-danger"
      }, _react.default.createElement(_Components.Icon, {
        className: "fa fa-remove"
      })), _react.default.createElement(_Components.Button, {
        onClick: this.handleLeft,
        className: "btn btn-light"
      }, _react.default.createElement(_Components.Icon, {
        className: "fa fa-repeat",
        style: {
          transform: "scaleX(-1)"
        }
      })), _react.default.createElement(_Components.Button, {
        onClick: this.handleRight,
        className: "btn btn-light"
      }, _react.default.createElement(_Components.Icon, {
        className: "fa fa-repeat"
      })), _react.default.createElement(_Components.Button, {
        onClick: this.handleReset,
        className: "btn btn-light"
      }, _react.default.createElement(_Components.Icon, {
        className: "fa fa-refresh"
      })), _react.default.createElement(_Components.Button, {
        onClick: this.setPreview,
        className: "btn btn-success cropd-img-preview-btn"
      }, _react.default.createElement(_react.default.Fragment, null, _react.default.createElement(_Components.Icon, {
        className: "fa fa-eye",
        style: {
          paddingLeft: 8
        }
      }))), _react.default.createElement(_Components.Button, {
        id: "submit-croppped-img-btn",
        className: "btn btn-success",
        onClick: this.handleSubmit
      }, _react.default.createElement(_Components.Icon, {
        className: "fa fa-check"
      }))));
    }
  }]);

  return ImageCropper;
}(_react.default.Component);

var _default = ImageCropper;
exports.default = _default;