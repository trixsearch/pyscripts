"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _axios = _interopRequireDefault(require("axios"));

var _Modal = _interopRequireDefault(require("react-bootstrap/Modal"));

var _DotsLoader = _interopRequireDefault(require("ezereactcomponents/build/Spinners/DotsLoader"));

var _browserCookies = _interopRequireDefault(require("browser-cookies"));

require("./VideoCapture.css");

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

var VideoUpload = /*#__PURE__*/function (_React$Component) {
  _inherits(VideoUpload, _React$Component);

  var _super = _createSuper(VideoUpload);

  function VideoUpload(props) {
    var _this;

    _classCallCheck(this, VideoUpload);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "countDownTimer", void 0);

    _defineProperty(_assertThisInitialized(_this), "countTimeOut", void 0);

    _defineProperty(_assertThisInitialized(_this), "mediaRecorder", void 0);

    _defineProperty(_assertThisInitialized(_this), "recordedBlobs", void 0);

    _defineProperty(_assertThisInitialized(_this), "errorMsgElement", void 0);

    _defineProperty(_assertThisInitialized(_this), "recordedVideo", void 0);

    _defineProperty(_assertThisInitialized(_this), "recordButton", void 0);

    _defineProperty(_assertThisInitialized(_this), "recordedVideo", void 0);

    _defineProperty(_assertThisInitialized(_this), "init", /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(constraints) {
        var stream;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return navigator.mediaDevices.getUserMedia(constraints);

              case 3:
                stream = _context.sent;

                _this.handleSuccess(stream);

                _context.next = 11;
                break;

              case 7:
                _context.prev = 7;
                _context.t0 = _context["catch"](0);
                console.error("navigator.getUserMedia error:", _context.t0);

                _this.setState({
                  errorMsg: "Error while trying to record video:\n        1. Please allow browser to access Audio(mic) and Video(Camera) in order to record video.\n        2. Use latest versions of either Google chrome or Mozilla Firefox, for better support and experience.\n        "
                });

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 7]]);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_this), "timeReducer", function () {
      var minutes = parseInt(_this.state.totalTime / 60, 10);
      var seconds = parseInt(_this.state.totalTime - minutes * 60, 10) || "00";

      _this.setState(function (prevState) {
        return {
          totalTime: prevState.totalTime - 1,
          remainingTime: {
            mins: "0".concat(minutes),
            secs: seconds < 10 && seconds > 0 ? "0".concat(seconds) : seconds
          }
        };
      });
    });

    _defineProperty(_assertThisInitialized(_this), "timer", function () {
      _this.timeReducer();

      _this.countDownTimer = setInterval(function () {
        _this.timeReducer();

        if (_this.state.totalTime < 0) {
          _this.resetTimer();
        }
      }, 1000);
      _this.countTimeOut = setTimeout(function () {
        _this.stopRecording();

        _this.setState({
          recordingComplete: true
        });
      }, (_this.state.totalTime + 1) * 1000);
    });

    _defineProperty(_assertThisInitialized(_this), "resetTimer", function () {
      clearInterval(_this.countDownTimer);

      _this.setState({
        totalTime: 15,
        remainingTime: {
          mins: "00",
          secs: "15"
        }
      });
    });

    _defineProperty(_assertThisInitialized(_this), "startRecording", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var hasEchoCancellation, constraints, options;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _this.setState({
                isRecording: true,
                errorMsg: null,
                recordingComplete: false
              });

              hasEchoCancellation = _this.state.hasEchoCancellation;
              constraints = {
                audio: {
                  echoCancellation: {
                    exact: hasEchoCancellation
                  }
                },
                video: {
                  facingMode: "user",
                  width: 1280,
                  height: 720
                }
              }; // console.log("Using media constraints:", constraints);

              _context2.next = 5;
              return _this.init(constraints);

            case 5:
              _this.recordedBlobs = [];
              options = {
                mimeType: "video/webm;codecs=vp9,opus"
              };

              if (!window.MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error("".concat(options.mimeType, " is not supported"));
                options = {
                  mimeType: "video/webm;codecs=vp8,opus"
                };

                if (!window.MediaRecorder.isTypeSupported(options.mimeType)) {
                  console.error("".concat(options.mimeType, " is not supported"));
                  options = {
                    mimeType: "video/webm"
                  };

                  if (!window.MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error("".concat(options.mimeType, " is not supported"));
                    options = {
                      mimeType: ""
                    };
                  }
                }
              }

              _context2.prev = 8;
              _this.mediaRecorder = new window.MediaRecorder(window.stream, options);
              _context2.next = 17;
              break;

            case 12:
              _context2.prev = 12;
              _context2.t0 = _context2["catch"](8);
              console.error("Exception while creating this.MediaRecorder:", _context2.t0);

              _this.setState({
                errorMsg: "Error while trying to record video:\n        1. Please allow browser to access Audio(mic) and Video(Camera) in order to record video.\n        2. Use latest versions of either Google chrome or Mozilla Firefox, for better support and experience.\n        "
              });

              return _context2.abrupt("return");

            case 17:
              // console.log(
              //   "Created this.MediaRecorder",
              //   window.mediaRecorder,
              //   "with options",
              //   options
              // );
              // this.recordButton.textContent = "Stop Recording";
              _this.mediaRecorder.ondataavailable = _this.handleDataAvailable;

              _this.mediaRecorder.start();

              _this.timer(); // console.log("this.MediaRecorder started", this.mediaRecorder);


            case 20:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[8, 12]]);
    })));

    _defineProperty(_assertThisInitialized(_this), "stopRecording", function () {
      _this.setState({
        isRecording: false
      });

      if (_this.mediaRecorder && _this.mediaRecorder.state !== 'inactive') {
        _this.mediaRecorder.stop();
      }

      if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      clearTimeout(_this.countTimeOut);

      _this.resetTimer();
    });

    _defineProperty(_assertThisInitialized(_this), "handleSuccess", function (stream) {
      // this.recordButton.disabled = false;
      // console.log("getUserMedia() got stream:", stream);
      window.stream = stream;
      var gumVideo = document.querySelector("video#gum");
      gumVideo.srcObject = stream;
    });

    _defineProperty(_assertThisInitialized(_this), "handleDataAvailable", function (event) {
      // console.log("handleDataAvailable", event);
      if (event.data && event.data.size > 0) {
        _this.recordedBlobs.push(event.data);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "handleUpload", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var API_BASE_URL, USER_TOKEN, config, URL, IS_ORG_APP, is_Open, blob, formData, _yield$Axios$post, data;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _this.setState({
                loader: true
              }); // console.log(this.recordedBlobs);


              API_BASE_URL = "".concat(process.env.REACT_APP_API_BASE_URL);
              USER_TOKEN = "JWT " + localStorage.getItem(_this.props.token);

              if (window.location.pathname.startsWith('/org')) {
                USER_TOKEN = "JWT ".concat(localStorage.getItem('candidate_token'));
              } else {
                USER_TOKEN = "Bearer ".concat(_browserCookies.default.get('access_token'));
              }

              config = {};
              URL = "".concat(API_BASE_URL, "/").concat(_this.props.orgId, "/forms/files?label=VideoCapture&transactionId=").concat(_this.props.transactionId);
              IS_ORG_APP = window.location.pathname.indexOf("/org") >= 0;
              is_Open = window.location.pathname.indexOf("/candidate/forms") >= 0;

              if (IS_ORG_APP || !is_Open) {
                config = {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: "".concat(USER_TOKEN)
                  }
                };
              } else {
                config = {
                  headers: {
                    "Content-Type": "multipart/form-data"
                  }
                };
                URL = "".concat(API_BASE_URL, "/").concat(_this.props.orgId, "/forms/files/open?label=VideoCapture&transactionId=").concat(_this.props.transactionId);
              }

              blob = new Blob(_this.recordedBlobs, {
                type: "video/webm"
              });
              _context3.prev = 10;
              formData = new FormData();
              formData.append("file", blob, "label");
              _context3.prev = 13;
              _context3.next = 16;
              return _axios.default.post(URL, formData, config);

            case 16:
              _yield$Axios$post = _context3.sent;
              data = _yield$Axios$post.data;

              // console.log("Server Response => ", data);
              _this.setState({
                loader: false,
                userMessage: "Video Uploaded successfully"
              });

              _this.props.onSubmit(data);

              return _context3.abrupt("return", Promise.resolve(data));

            case 23:
              _context3.prev = 23;
              _context3.t0 = _context3["catch"](13);

              _this.setState({
                loader: false
              });

              console.log(_context3.t0);

              _this.setState({
                errorMsg: "Failed to upload Video"
              });

              _this.props.onSubmit(null);

              return _context3.abrupt("return", Promise.reject(_context3.t0));

            case 30:
              _context3.next = 39;
              break;

            case 32:
              _context3.prev = 32;
              _context3.t1 = _context3["catch"](10);

              _this.setState({
                loader: false
              });

              console.log(_context3.t1);

              _this.setState({
                errorMsg: "Failed to upload Video"
              });

              _this.props.onSubmit(null);

              return _context3.abrupt("return", Promise.reject(_context3.t1));

            case 39:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[10, 32], [13, 23]]);
    })));

    _defineProperty(_assertThisInitialized(_this), "handleStartRecording", function () {
      _this.startRecording();
    });

    _defineProperty(_assertThisInitialized(_this), "handleStopRecording", function () {
      if (_this.state.isRecording) {
        _this.stopRecording();

        return;
      }
    });

    _this.preview = _react.default.createRef();
    _this.state = {
      loader: false,
      hasEchoCancellation: true,
      errorMsg: "",
      preview: "",
      isRecording: false,
      totalTime: _this.props.duration || 15,
      // in seconds
      countDown: {
        mins: "00",
        secs: _this.props.duration || 15
      },
      remainingTime: {
        mins: "00",
        secs: _this.props.duration || 15
      },
      recordingComplete: false,
      userMessage: "Recording completed, you can upload the video"
    };
    return _this;
  }

  _createClass(VideoUpload, [{
    key: "componentDidMount",
    value: function componentDidMount() {}
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.state.isRecording) {
        this.stopRecording();
      }
    }
  }, {
    key: "render",
    value: function render() {
      return _react.default.createElement(_Modal.default, {
        show: true,
        onClose: function onClose() {// console.log("closed");
        },
        title: "Capture Video",
        className: "aadhar-capture-modal"
      }, _react.default.createElement(_Modal.default.Body, {
        className: "videoCaptureContainer"
      }, _react.default.createElement("div", {
        className: "VideoWrapperContainer"
      }, _react.default.createElement("video", {
        className: "videoCapture",
        id: "gum",
        playsInline: true,
        autoPlay: true,
        muted: true
      }), !this.state.isRecording && !this.state.recordingComplete && _react.default.createElement("div", {
        className: "backgroundText"
      }, "Video Recording will start with Record button", _react.default.createElement("br", null), _react.default.createElement("button", {
        disabled: true,
        type: "button",
        id: "record-disabled",
        className: "btn darkOutlineButton btn-sm"
      }, _react.default.createElement("span", {
        className: "glyphicon glyphicon-record"
      }), "\xA0Record")), _react.default.createElement("div", {
        className: "countDownTime"
      }, this.state.isRecording && _react.default.createElement("span", null, "".concat(this.state.remainingTime.mins, " : ").concat(this.state.remainingTime.secs))), (this.state.recordingComplete && !this.state.errorMsg || this.state.errorMsg) && _react.default.createElement("div", {
        className: "MessageContainer"
      }, this.state.recordingComplete && !this.state.errorMsg && _react.default.createElement("h4", null, this.state.userMessage), this.state.errorMsg && _react.default.createElement("h4", {
        id: "errorMsg",
        style: {
          color: "red"
        }
      }, this.state.errorMsg))), this.state.loader && _react.default.createElement(_DotsLoader.default, {
        style: {
          position: "absolute",
          top: 0,
          left: "50%"
        }
      }), _react.default.createElement("div", {
        className: "buttonContainer"
      }, _react.default.createElement("button", {
        className: "btn darkOutlineButton btn-sm",
        onClick: this.handleStartRecording,
        disabled: this.state.isRecording,
        type: "button",
        id: "record"
      }, _react.default.createElement("span", {
        className: "glyphicon glyphicon-record"
      }), "\xA0Record"), _react.default.createElement("button", {
        className: "btn dangerOutlineButton btn-sm",
        type: "button",
        onClick: this.handleStopRecording,
        disabled: !this.state.isRecording
      }, _react.default.createElement("span", {
        className: "glyphicon glyphicon-stop"
      }), "\xA0Stop"), _react.default.createElement("button", {
        className: "btn primaryOutlineButton btn-sm",
        type: "button",
        onClick: this.handleUpload,
        disabled: !this.state.recordingComplete
      }, _react.default.createElement("span", {
        className: "glyphicon glyphicon-upload"
      }), "\xA0Upload")), _react.default.createElement("span", {
        onClick: this.props.onClose,
        className: "closeButton glyphicon glyphicon-remove-circle"
      })));
    }
  }]);

  return VideoUpload;
}(_react.default.Component);

var _default = VideoUpload;
exports.default = _default;