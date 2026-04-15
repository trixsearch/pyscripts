"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactCropper = _interopRequireDefault(require("react-cropper"));

var _Modal = _interopRequireDefault(require("react-bootstrap/Modal"));

var _Spinner = _interopRequireDefault(require("../Spinners/Spinner"));

var _cropperutils = require("./cropperutils");

require("cropperjs/dist/cropper.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

var Button = function Button(_ref) {
  var id = _ref.id,
      className = _ref.className,
      style = _ref.style,
      onClick = _ref.onClick,
      children = _ref.children,
      _ref$disabled = _ref.disabled,
      disabled = _ref$disabled === void 0 ? false : _ref$disabled;
  return _react.default.createElement("div", {
    className: "btn-group",
    style: {
      height: '100%'
    }
  }, _react.default.createElement("button", {
    id: id || '',
    className: className,
    style: style,
    onClick: onClick,
    type: "button",
    disabled: disabled
  }, children));
};

var Icon = function Icon(_ref2) {
  var className = _ref2.className,
      style = _ref2.style;
  return _react.default.createElement("span", {
    className: className,
    style: style
  });
};

var AspectRatioOptions = {
  0: {
    name: '16 x 9',
    value: 16 / 9
  },
  1: {
    name: '4 x 3',
    value: 4 / 3
  },
  2: {
    name: '1 x 1',
    value: 1 / 1
  },
  3: {
    name: 'Custom',
    value: NaN
  }
};

var ImageCropper = /*#__PURE__*/function (_React$Component) {
  _inherits(ImageCropper, _React$Component);

  var _super = _createSuper(ImageCropper);

  function ImageCropper(props) {
    var _this;

    _classCallCheck(this, ImageCropper);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "handleSelect", function (_ref3) {
      var value = _ref3.target.value;

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

    _defineProperty(_assertThisInitialized(_this), "setPreview", function () {
      var _this$cropper$current;

      if ((_this$cropper$current = _this.cropper.current) === null || _this$cropper$current === void 0 ? void 0 : _this$cropper$current.getCroppedCanvas) {
        _this.setState(function (state) {
          var _assertThisInitialize, _assertThisInitialize2, _assertThisInitialize3, _assertThisInitialize4;

          return {
            preview: (_assertThisInitialize = _assertThisInitialized(_this)) === null || _assertThisInitialize === void 0 ? void 0 : (_assertThisInitialize2 = _assertThisInitialize.cropper) === null || _assertThisInitialize2 === void 0 ? void 0 : (_assertThisInitialize3 = _assertThisInitialize2.current) === null || _assertThisInitialize3 === void 0 ? void 0 : (_assertThisInitialize4 = _assertThisInitialize3.getCroppedCanvas()) === null || _assertThisInitialize4 === void 0 ? void 0 : _assertThisInitialize4.toDataURL(state.fileType, state.quality)
          };
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "handleReset", function () {
      _this.setState({
        preview: ''
      });

      if (_this.cropper.current) {
        _this.cropper.current.reset();
      }
    });

    _this.cropper = _react.default.createRef();
    _this.state = {
      img: '',
      aspRatio: 16 / 9,
      aspRatioOptions: [],
      modal: false,
      loader: false,
      preview: '',
      fileType: 'image/jpeg',
      quality: 0.5,
      loading: false,
      disablePreviewButton: true
    };
    return _this;
  }

  _createClass(ImageCropper, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      var orgId = this.props.orgId;

      window.getCroppedImage = /*#__PURE__*/function () {
        var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(data, label, id) {
          var quality,
              aspRatio,
              openForm,
              _data,
              myFile,
              res,
              defaultAspRatio,
              _args2 = arguments;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  quality = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : 0.5;
                  aspRatio = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : [];

                  if (!(!id || !data)) {
                    _context2.next = 4;
                    break;
                  }

                  return _context2.abrupt("return", Promise.reject());

                case 4:
                  // Todo remove this hack of checking the open form from array
                  // The parameters of this function should changed to json object
                  openForm = aspRatio.length === 2 ? true : false;
                  _data = _slicedToArray(data, 1), myFile = _data[0];

                  if (/image\/*/g.test(myFile.type)) {
                    _context2.next = 21;
                    break;
                  }

                  _this2.setState({
                    loader: true
                  });

                  _context2.prev = 8;
                  _context2.next = 11;
                  return (0, _cropperutils.getUrlFromFile)(orgId, myFile.url, label, id, myFile, _this2.props.token);

                case 11:
                  res = _context2.sent;
                  return _context2.abrupt("return", Promise.resolve(res));

                case 15:
                  _context2.prev = 15;
                  _context2.t0 = _context2["catch"](8);
                  return _context2.abrupt("return", Promise.reject(_context2.t0));

                case 18:
                  _context2.prev = 18;

                  _this2.setState({
                    loader: false
                  });

                  return _context2.finish(18);

                case 21:
                  defaultAspRatio = 16 / 9;

                  if (aspRatio.length >= 1) {
                    defaultAspRatio = AspectRatioOptions[aspRatio[0]].value;
                  }

                  _this2.setState({
                    modal: true,
                    loader: true,
                    aspRatio: defaultAspRatio,
                    aspRatioOptions: aspRatio.length > 1 && aspRatio.reduce(function (acc, entry) {
                      if (AspectRatioOptions[entry]) acc.push(AspectRatioOptions[entry]);
                      return acc;
                    }, [])
                  });

                  return _context2.abrupt("return", new Promise(function (resolve, reject) {
                    try {
                      setTimeout(function () {
                        _this2.setState({
                          img: myFile.url,
                          disablePreviewButton: true
                        }, function () {
                          _this2.setState({
                            loader: false,
                            fileType: myFile.type,
                            quality: quality
                          });
                        });
                      }, 100);

                      if (document.getElementById('crop-cancel')) {
                        document.getElementById('crop-cancel').addEventListener('click', function () {
                          _this2.setState({
                            modal: false,
                            img: '',
                            preview: '',
                            disablePreviewButton: true
                          });

                          resolve([]);
                        });
                      }

                      if (document.getElementById('submit-croppped-img-btn')) {
                        document.getElementById('submit-croppped-img-btn').addEventListener('click', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                          var MyImage, fileJson;
                          return regeneratorRuntime.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  _this2.setState({
                                    modal: false,
                                    loader: true
                                  });

                                  MyImage = _this2.state.preview;
                                  _context.prev = 2;
                                  _context.next = 5;
                                  return (0, _cropperutils.getUrlFromFile)(orgId, MyImage, label, id, myFile, _this2.props.token, openForm);

                                case 5:
                                  fileJson = _context.sent;
                                  resolve(fileJson);
                                  _context.next = 12;
                                  break;

                                case 9:
                                  _context.prev = 9;
                                  _context.t0 = _context["catch"](2);
                                  reject(_context.t0);

                                case 12:
                                  _this2.setState({
                                    img: '',
                                    aspRatio: 16 / 9,
                                    aspRatioOptions: [],
                                    preview: '',
                                    loader: false,
                                    disablePreviewButton: true
                                  });

                                case 13:
                                case "end":
                                  return _context.stop();
                              }
                            }
                          }, _callee, null, [[2, 9]]);
                        })));
                      }
                    } catch (err) {
                      reject(err);
                    }
                  }));

                case 25:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, null, [[8, 15, 18, 21]]);
        }));

        return function (_x, _x2, _x3) {
          return _ref4.apply(this, arguments);
        };
      }();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      window.getCroppedImage = undefined;
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var _this$state = this.state,
          loader = _this$state.loader,
          modal = _this$state.modal,
          preview = _this$state.preview,
          aspRatio = _this$state.aspRatio,
          aspRatioOptions = _this$state.aspRatioOptions,
          img = _this$state.img,
          loading = _this$state.loading;
      return _react.default.createElement(_react.default.Fragment, null, (loader || loading) && _react.default.createElement(_Spinner.default, null), modal && _react.default.createElement(_Modal.default, {
        className: "reusable-modal-container-2",
        show: modal,
        onHide: function onHide() {
          _this3.setState({
            modal: false,
            preview: ''
          });
        },
        centered: true,
        animation: true
      }, _react.default.createElement(_Modal.default.Header, {
        className: "cropper-header"
      }, _react.default.createElement(_Modal.default.Title, {
        className: "text-center"
      }, "Crop Image")), _react.default.createElement(_Modal.default.Body, {
        className: "pt-0"
      }, _react.default.createElement("div", {
        className: "cropd-img-preview-cont",
        style: preview ? {
          visibility: 'visible'
        } : {
          visibility: 'hidden',
          height: 4
        }
      }, _react.default.createElement("img", {
        src: preview,
        alt: "Preview"
      })), _react.default.createElement(_reactCropper.default, {
        src: img,
        style: {
          height: preview ? 4 : 400,
          width: '100%',
          visibility: preview ? 'hidden' : 'visible'
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
          _this3.cropper.current = insatnce;

          _this3.setState({
            loading: true
          });
        },
        onLoad: function onLoad() {
          _this3.setState({
            disablePreviewButton: false,
            loading: false
          });
        }
      }), _react.default.createElement("div", {
        className: "preview-controls-container",
        style: {
          visibility: preview ? 'visible' : 'hidden',
          height: preview ? '100%' : 4
        }
      }, _react.default.createElement(Button, {
        onClick: function onClick() {
          _this3.setState({
            preview: ''
          });
        },
        className: "btn btn-danger"
      }, _react.default.createElement(Icon, {
        className: "fa fa-remove"
      })), _react.default.createElement(Button, {
        id: "submit-croppped-img-btn",
        className: "btn btn-success"
      }, _react.default.createElement(Icon, {
        className: "fa fa-check"
      })))), _react.default.createElement("div", {
        className: "crop-controls-container",
        style: {
          visibility: loader || preview ? 'hidden' : 'visible'
        }
      }, aspRatioOptions.length > 1 && _react.default.createElement("div", {
        className: "input-group mb-3",
        style: {
          maxWidth: '33%',
          display: 'flex'
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
      }))), _react.default.createElement(Button, {
        id: "crop-cancel",
        onClick: function onClick() {
          _this3.cropper.current.reset();
        },
        className: "btn btn-danger"
      }, _react.default.createElement(Icon, {
        className: "fa fa-remove"
      })), _react.default.createElement(Button, {
        onClick: this.handleLeft,
        className: "btn btn-light"
      }, _react.default.createElement(Icon, {
        className: "fa fa-repeat",
        style: {
          transform: 'scaleX(-1)'
        }
      })), _react.default.createElement(Button, {
        onClick: this.handleRight,
        className: "btn btn-light"
      }, _react.default.createElement(Icon, {
        className: "fa fa-repeat"
      })), _react.default.createElement(Button, {
        onClick: this.handleReset,
        className: "btn btn-light"
      }, _react.default.createElement(Icon, {
        className: "fa fa-refresh"
      })), _react.default.createElement(Button, {
        disabled: this.state.disablePreviewButton,
        onClick: this.setPreview,
        className: "btn btn-success cropd-img-preview-btn"
      }, _react.default.createElement(_react.default.Fragment, null, "Preview", _react.default.createElement(Icon, {
        className: "fa fa-eye",
        style: {
          paddingLeft: 8,
          paddingTop: 4
        }
      }))))));
    }
  }]);

  return ImageCropper;
}(_react.default.Component);

var _default = _react.default.memo(ImageCropper);

exports.default = _default;