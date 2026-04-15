"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _Utils = require("../Utils");

var _cameraClick = _interopRequireDefault(require("../../Assets/camera-click.svg"));

var _switchCamera = _interopRequireDefault(require("../../Assets/switch-camera.svg"));

var _DotsLoader = _interopRequireDefault(require("../../Spinners/DotsLoader"));

var _Components = require("../shared/Components");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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

var Camera = /*#__PURE__*/function (_React$Component) {
  _inherits(Camera, _React$Component);

  var _super = _createSuper(Camera);

  function Camera(props) {
    var _this;

    _classCallCheck(this, Camera);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "gotStream", function (stream) {
      window.stream = stream; // make stream available to console

      _this.videoElement.current.srcObject = stream; // Refresh button list in case labels have become available
      // return navigator.mediaDevices.enumerateDevices();
    });

    _defineProperty(_assertThisInitialized(_this), "gotDevices", function (availableDevices) {
      var videoDevices = availableDevices.filter(function (device) {
        return device.kind === "videoinput";
      }); // .map(({ label, deviceId }) => ({ label, value: deviceId }));

      _this.setState({
        cameraDevices: videoDevices.length
      });
    });

    _defineProperty(_assertThisInitialized(_this), "setCapturing", function () {
      var isCapturing = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          isCapturing: isCapturing
        });
      }, function () {
        if (isCapturing) {
          _this.startCapture();
        }

        if (_this.props.onCaptureStart) {
          _this.props.onCaptureStart(_this.props.type);
        }
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleError", function (error) {
      console.log("navigator.MediaDevices.getUserMedia error: ", error);

      _this.props.setWebCam(false);
    });

    _defineProperty(_assertThisInitialized(_this), "startCapture", function () {
      if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      _this.boundingBox.current.style.display = "block";
      var videoSource = _this.state.selectedDevice;
      var constraints = {
        video: {
          facingMode: videoSource // width: {
          //   min: 1280
          // }

        }
      };
      navigator.mediaDevices.getUserMedia(constraints).then(_this.gotStream) // .then(this.gotDevices)
      .catch(_this.handleError);
    });

    _defineProperty(_assertThisInitialized(_this), "capturePicture", function () {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          isCapturing: false
        });
      });

      var videoWrapper = _this.videoWrapper.current;
      var overlay = _this.boundingBox.current;
      var video = _this.videoElement.current;
      var canvas = _this.videoCanvas.current;
      var parentTop = videoWrapper.getBoundingClientRect().top;
      var parentleft = videoWrapper.getBoundingClientRect().left;
      var overlayTop = overlay.getBoundingClientRect().top;
      var overlayLeft = overlay.getBoundingClientRect().left;
      var factor = 4;
      var startX = Math.round(overlayLeft - parentleft) * factor;
      var startY = Math.round(overlayTop - parentTop) * factor;
      var overlayWidth = overlay.getBoundingClientRect().width * factor;
      var overlayHeight = overlay.getBoundingClientRect().height * factor;
      var ctx = canvas.getContext("2d");
      canvas.width = video.clientWidth * factor;
      canvas.height = video.clientHeight * factor; // ctx.setTransform(1,0,0,-1,0, videoHeight);

      ctx.drawImage(video, 0, 0, video.clientWidth * factor, video.clientHeight * factor);
      var imageData = ctx.getImageData(startX, startY, overlayWidth, overlayHeight);
      var destCanvas = document.createElement("canvas");
      destCanvas.width = overlayWidth;
      destCanvas.height = overlayHeight;
      var ctx1 = destCanvas.getContext("2d");
      ctx1.rect(0, 0, overlayWidth, overlayHeight);
      ctx1.fillStyle = "transparent";
      ctx1.fill();
      ctx1.putImageData(imageData, 0, 0); // put data to the img element

      var image = destCanvas.toDataURL("image/jpeg", 1);

      _this.stopCapture();

      _this.handleSubmit(image);
    });

    _defineProperty(_assertThisInitialized(_this), "handleDeviceChange", function () {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          selectedDevice: prevState.selectedDevice === "user" ? "environment" : "user"
        });
      }, function () {
        _this.startCapture();
      });
    });

    _defineProperty(_assertThisInitialized(_this), "stopCapture", function () {
      if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "discardCapture", function () {
      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          isCaptured: false,
          previewImg: ""
        });
      }, function () {
        _this.props.handleCancel(_this.props.type);
      });
    });

    _defineProperty(_assertThisInitialized(_this), "handleSubmit", /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file) {
        var fileBlob;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _this.setState(function (prevState) {
                  return _objectSpread({}, prevState, {
                    isCaptured: true,
                    previewImg: file,
                    loader: false
                  });
                });

                _context.next = 3;
                return (0, _Utils.base64ToBlob)(file);

              case 3:
                fileBlob = _context.sent;

                _this.props.handleSubmit(fileBlob, _this.props.type);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());

    _this.videoElement = _react.default.createRef();
    _this.videoCanvas = _react.default.createRef();
    _this.boundingBox = _react.default.createRef();
    _this.videoWrapper = _react.default.createRef();
    _this.state = {
      pendingMessage: "",
      cameraDevices: 0,
      cameraOptions: [{
        label: "Front Camera",
        value: "user"
      }, {
        label: "Back Camera",
        value: "environment"
      }],
      selectedDevice: "environment",
      isCapturing: false,
      isCaptured: false
    };
    return _this;
  }

  _createClass(Camera, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      try {
        navigator.mediaDevices.enumerateDevices().then(this.gotDevices).catch(this.handleError);
      } catch (err) {
        this.props.setWebCam(false);
        this.handleError(err);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.stopCapture();
    }
  }, {
    key: "render",
    value: function render() {
      var _this$state = this.state,
          loader = _this$state.loader,
          isCapturing = _this$state.isCapturing,
          isCaptured = _this$state.isCaptured,
          previewImg = _this$state.previewImg;
      return _react.default.createElement("div", null, _react.default.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "center"
        }
      }, loader && _react.default.createElement(_DotsLoader.default, null)), _react.default.createElement("div", {
        className: "display-cover"
      }, isCapturing ? _react.default.createElement("div", null, _react.default.createElement("div", {
        ref: this.videoWrapper,
        className: "video-container"
      }, _react.default.createElement("video", {
        ref: this.videoElement,
        id: "video",
        playsInline: true,
        autoPlay: true
      }), _react.default.createElement("div", {
        ref: this.boundingBox,
        className: "doc-bounding-box"
      })), _react.default.createElement("div", {
        className: "controls"
      }, _react.default.createElement(_Components.Button, {
        className: "aadhar-cam-capture-btn",
        title: "Capture",
        onClick: this.capturePicture
      }, _react.default.createElement("img", {
        src: _cameraClick.default,
        alt: ""
      })), this.state.cameraDevices > 1 && _react.default.createElement(_Components.Button, {
        className: "aadhar-cam-capture-btn",
        title: "Change Camera",
        onClick: this.handleDeviceChange
      }, _react.default.createElement("img", {
        src: _switchCamera.default,
        alt: ""
      }))), _react.default.createElement("canvas", {
        ref: this.videoCanvas,
        id: "videoCanvas",
        style: {
          display: "none"
        }
      })) : _react.default.createElement(_Components.FilePlaceHolder, {
        label: this.props.displayLabel,
        closeBtn: isCaptured || this.props.previewImg,
        onCancel: this.discardCapture
      }, isCaptured || this.props.previewImg ? _react.default.createElement(_Components.CapturePreview, {
        src: previewImg || this.props.previewImg
      }) : _react.default.createElement(_Components.AddFileIcon, {
        onClick: this.setCapturing
      }))));
    }
  }]);

  return Camera;
}(_react.default.Component);

var _default = Camera;
exports.default = _default;