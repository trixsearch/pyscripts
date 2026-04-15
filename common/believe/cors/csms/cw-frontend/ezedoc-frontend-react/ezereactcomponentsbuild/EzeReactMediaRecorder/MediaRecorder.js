"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _axios = _interopRequireDefault(require("axios"));

var _reactWithMediarecorder = _interopRequireDefault(require("react-with-mediarecorder"));

var _DotsLoader = _interopRequireDefault(require("../Spinners/DotsLoader"));

var _browserCookies = _interopRequireDefault(require("browser-cookies"));

require("./MediaRecorder.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

var RecordDuration = /*#__PURE__*/function (_React$Component) {
  _inherits(RecordDuration, _React$Component);

  var _super = _createSuper(RecordDuration);

  function RecordDuration(props) {
    var _this;

    _classCallCheck(this, RecordDuration);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "countDownTimer", void 0);

    _defineProperty(_assertThisInitialized(_this), "countTimeOut", void 0);

    _defineProperty(_assertThisInitialized(_this), "startTimer", function () {
      _this.timeReducer();

      _this.countDownTimer = setInterval(function () {
        _this.timeReducer();
      }, 1000);
      _this.countTimeOut = setTimeout(function () {
        _this.resetTimer();

        _this.props.timeout();
      }, (parseInt(_this.props.duration, 10) + 1) * 1000);
    });

    _defineProperty(_assertThisInitialized(_this), "resetTimer", function () {
      if (_this.countDownTimer) {
        clearInterval(_this.countDownTimer);
      }

      _this.setState({
        remainingTime: {
          mins: "00",
          secs: _this.props.duration
        },
        totalTime: _this.props.duration
      });
    });

    _defineProperty(_assertThisInitialized(_this), "timeReducer", function () {
      var minutes = parseInt(_this.state.totalTime / 60, 10);
      var seconds = parseInt(_this.state.totalTime - minutes * 60, 10) || "00";

      _this.setState(function (prevState) {
        return _objectSpread({}, prevState, {
          remainingTime: {
            mins: "0".concat(minutes),
            secs: seconds < 10 && seconds > 0 ? "0".concat(seconds) : seconds
          },
          totalTime: prevState.totalTime - 1
        });
      });
    });

    _this.state = {
      totalTime: _this.props.duration,
      remainingTime: {
        mins: "00",
        secs: _this.props.duration
      }
    };
    return _this;
  }

  _createClass(RecordDuration, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.startTimer();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.countTimeOut) {
        clearTimeout(this.countTimeOut);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var remainingTime = this.state.remainingTime;
      return _react.default.createElement("div", {
        className: "timerText"
      }, _react.default.createElement("span", {
        style: {
          textAlign: "center"
        }
      }, "".concat(remainingTime.mins, " : ").concat(remainingTime.secs, " / 00 : ").concat(this.props.duration)));
    }
  }]);

  return RecordDuration;
}(_react.default.Component);

var MediaRecorder = /*#__PURE__*/function (_React$Component2) {
  _inherits(MediaRecorder, _React$Component2);

  var _super2 = _createSuper(MediaRecorder);

  function MediaRecorder(props) {
    var _this2;

    _classCallCheck(this, MediaRecorder);

    _this2 = _super2.call(this, props);

    _defineProperty(_assertThisInitialized(_this2), "checkCompatibility", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var tempMediaStream, tempMediaRecorder;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (_this2.hasUserMedia()) {
                _context.next = 2;
                break;
              }

              throw new Error("Navigator does not support video media record.");

            case 2:
              if (_this2.hasAudioVideoDevices()) {
                _context.next = 4;
                break;
              }

              throw new Error("Not audio/video input devices detected.");

            case 4:
              _context.prev = 4;
              _context.next = 7;
              return window.navigator.mediaDevices.getUserMedia(_this2.props.mediaConstraints);

            case 7:
              tempMediaStream = _context.sent;
              tempMediaRecorder = new window.MediaRecorder(tempMediaStream);
              tempMediaRecorder.start();
              _context.next = 17;
              break;

            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](4);

              if (!(_context.t0 === "NotAllowedError")) {
                _context.next = 16;
                break;
              }

              throw new Error("Media access not allowed, cant record.");

            case 16:
              throw _context.t0;

            case 17:
              _context.prev = 17;

              if (tempMediaStream) {
                tempMediaStream.getTracks().map(function (t) {
                  return t.stop();
                });
              }

              return _context.finish(17);

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[4, 12, 17, 20]]);
    })));

    _defineProperty(_assertThisInitialized(_this2), "hasUserMedia", function () {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    });

    _defineProperty(_assertThisInitialized(_this2), "hasAudioVideoDevices", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var hasAudio, hasVideo, videoDevices, devices;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              hasAudio = false;
              hasVideo = false;
              videoDevices = 0;
              _context2.next = 5;
              return navigator.mediaDevices.enumerateDevices();

            case 5:
              devices = _context2.sent;
              devices.forEach(function (device) {
                if (device.kind === "audioinput") hasAudio = true;

                if (device.kind === "videoinput") {
                  hasVideo = true;
                  videoDevices += 1;
                }
              });

              if (videoDevices > 1) {
                _this2.setState({
                  showCamSwitch: true
                });
              }

              return _context2.abrupt("return", hasAudio && hasVideo);

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    })));

    _defineProperty(_assertThisInitialized(_this2), "startRecording", function (callback) {
      try {
        _this2.props.setCamSwitch(false);

        if (callback) {
          _this2.setState({
            isUserStopped: false
          });

          callback();
        }
      } catch (e) {
        _this2.setState({
          webrtcEnabled: false
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this2), "stopRecording", function (callback, isUserStopped) {
      if (isUserStopped) {
        _this2.setState({
          isUserStopped: isUserStopped
        });
      }

      if (callback) {
        callback();
      }
    });

    _defineProperty(_assertThisInitialized(_this2), "handleComplete", function (recordedBlob) {
      if (!_this2.state.isUserStopped) {
        _this2.props.mediaRecorder.closeMedia();

        _this2.setState({
          recordingComplete: true,
          recordedBlob: recordedBlob
        });

        if (recordedBlob) {// console.log('blob >>>', blob);
        }
      } else {// console.log("Stopped by User");
        }
    });

    _defineProperty(_assertThisInitialized(_this2), "handleFileChange", function (_ref3) {
      var _ref3$target$files = _slicedToArray(_ref3.target.files, 1),
          file = _ref3$target$files[0];

      if (/video\/*/.test(file.type)) {
        _this2.setState({
          isFileSelected: true,
          fileName: file.name,
          recordedBlob: file,
          errorMsg: "",
          fileType: file.type
        });
      } else {
        _this2.setState({
          errorMsg: "Please Upload only Video file"
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this2), "handleUpload", /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var API_BASE_URL, USER_TOKEN, config, URL, IS_ORG_APP, is_Open, fileName, formData, _yield$Axios$post, data;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              API_BASE_URL = "".concat(process.env.REACT_APP_API_BASE_URL);

              _this2.setState({
                loader: true
              });

              USER_TOKEN = "JWT " + localStorage.getItem(_this2.props.token);

              if (window.location.pathname.startsWith('/org')) {
                USER_TOKEN = "JWT ".concat(localStorage.getItem('candidate_token'));
              } else {
                USER_TOKEN = "Bearer ".concat(_browserCookies.default.get('access_token'));
              }

              config = {};
              URL = "".concat(API_BASE_URL, "/").concat(_this2.props.orgId, "/forms/files?label=VideoCapture&transactionId=").concat(_this2.props.transactionId);
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
                URL = "".concat(API_BASE_URL, "/").concat(_this2.props.orgId, "/forms/files/open?label=VideoCapture&transactionId=").concat(_this2.props.transactionId);
              } // const blob = new Blob(RECORDED_BLOB, { type: "video/webm" });


              fileName = _this2.state.recordedBlob.name || "VideoCapture.".concat(_this2.state.recordedBlob.type.split('video/')[1]);
              _context3.prev = 10;
              formData = new FormData();
              formData.append("file", _this2.state.recordedBlob, fileName);
              _context3.prev = 13;
              _context3.next = 16;
              return _axios.default.post(URL, formData, config);

            case 16:
              _yield$Axios$post = _context3.sent;
              data = _yield$Axios$post.data;

              _this2.setState({
                loader: false,
                // eslint-disable-next-line react/no-unused-state
                userMessage: "Video Uploaded successfully"
              });

              _this2.props.onSubmit(_objectSpread({}, data, {
                type: _this2.state.fileType,
                name: fileName,
                label: fileName
              }));

              return _context3.abrupt("return", Promise.resolve(_objectSpread({}, data, {
                type: _this2.state.fileType,
                name: fileName,
                label: fileName
              })));

            case 23:
              _context3.prev = 23;
              _context3.t0 = _context3["catch"](13);

              _this2.setState({
                loader: false
              });

              console.log(_context3.t0);

              _this2.setState({
                errorMsg: "Failed to upload Video"
              });

              _this2.props.onSubmit(null);

              return _context3.abrupt("return", Promise.reject(_context3.t0));

            case 30:
              _context3.next = 39;
              break;

            case 32:
              _context3.prev = 32;
              _context3.t1 = _context3["catch"](10);

              _this2.setState({
                loader: false
              });

              console.log(_context3.t1);

              _this2.setState({
                errorMsg: "Failed to upload Video"
              });

              _this2.props.onSubmit(null);

              return _context3.abrupt("return", Promise.reject(_context3.t1));

            case 39:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[10, 32], [13, 23]]);
    })));

    _this2.state = {
      recordingComplete: false,
      isUserStopped: false,
      recordedBlob: null,
      errorMsg: null,
      loader: false,
      webrtcEnabled: true,
      isFileSelected: false,
      fileSelected: null,
      fileName: "",
      showCamSwitch: false,
      fileType: "video/webm"
    };
    return _this2;
  }

  _createClass(MediaRecorder, [{
    key: "componentDidMount",
    value: function () {
      var _componentDidMount = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this.setState({
                  loader: true
                });
                _context4.prev = 1;
                _context4.next = 4;
                return this.checkCompatibility();

              case 4:
                _context4.prev = 4;
                _context4.next = 7;
                return this.props.mediaRecorder.askPermissions();

              case 7:
                this.setState({
                  webrtcEnabled: true
                });
                _context4.next = 13;
                break;

              case 10:
                _context4.prev = 10;
                _context4.t0 = _context4["catch"](4);
                this.setState({
                  webrtcEnabled: false
                });

              case 13:
                _context4.next = 18;
                break;

              case 15:
                _context4.prev = 15;
                _context4.t1 = _context4["catch"](1);
                this.setState({
                  webrtcEnabled: false
                });

              case 18:
                _context4.prev = 18;
                this.setState({
                  loader: false
                });
                return _context4.finish(18);

              case 21:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[1, 15, 18, 21], [4, 10]]);
      }));

      function componentDidMount() {
        return _componentDidMount.apply(this, arguments);
      }

      return componentDidMount;
    }()
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      try {
        this.props.mediaRecorder.closeMedia(); // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var _this$props = this.props,
          durationInSec = _this$props.durationInSec,
          mediaRecorder = _this$props.mediaRecorder;
      var previewElement = mediaRecorder.previewElement,
          isRecording = mediaRecorder.isRecording,
          record = mediaRecorder.record,
          stopRecord = mediaRecorder.stopRecord,
          onRecordStop = mediaRecorder.onRecordStop;
      var _this$state = this.state,
          recordingComplete = _this$state.recordingComplete,
          webrtcEnabled = _this$state.webrtcEnabled,
          loader = _this$state.loader,
          errorMsg = _this$state.errorMsg,
          isFileSelected = _this$state.isFileSelected,
          fileName = _this$state.fileName,
          showCamSwitch = _this$state.showCamSwitch;
      mediaRecorder.onRecordStop(this.handleComplete);
      return _react.default.createElement("div", {
        className: "recordScreen"
      }, loader && _react.default.createElement(_DotsLoader.default, {
        style: {
          left: '45%'
        }
      }), errorMsg && _react.default.createElement("div", {
        className: "overlayText"
      }, errorMsg), _react.default.createElement("div", {
        className: "renderPart makeCenter"
      }, webrtcEnabled ? _react.default.createElement(_react.default.Fragment, null, !recordingComplete && _react.default.createElement(_react.default.Fragment, null, _react.default.createElement("div", {
        className: "videoWrapper"
      }, previewElement), _react.default.createElement("span", {
        role: "presentation",
        className: "iconButton floatButton ".concat(!mediaRecorder.isRecording ? "startButton fa fa-play" : "stopButton fa fa-stop")
        /* eslint-disable-next-line */
        ,
        onClick: function onClick() {
          return !isRecording ? _this3.startRecording(record) : _this3.stopRecording(stopRecord, true);
        }
      }), showCamSwitch && this.props.cameraSwitch, mediaRecorder.isRecording && _react.default.createElement(_react.default.Fragment, null, _react.default.createElement("span", {
        className: "recordingIndicator"
      }, _react.default.createElement("span", {
        className: "recText"
      }, "REC"), _react.default.createElement("span", {
        className: "recordingIndicatorCircle"
      })), _react.default.createElement(RecordDuration, {
        duration: durationInSec,
        timeout: function timeout() {
          return _this3.stopRecording(onRecordStop, false);
        }
      }))), !mediaRecorder.isRecording && recordingComplete && _react.default.createElement("div", {
        className: "wrapper makeCenter"
      }, _react.default.createElement("div", {
        className: "overlayText"
      }, "Video Recording is complete. Press this button to upload ", _react.default.createElement("br", null), _react.default.createElement("span", {
        role: "presentation",
        onClick: this.handleUpload,
        className: "iconButton uploadButton glyphicon glyphicon-arrow-up"
      })))) : _react.default.createElement(_react.default.Fragment, null, isFileSelected ? _react.default.createElement("div", {
        className: "wrapper makeCenter"
      }, _react.default.createElement("div", {
        className: "overlayText"
      }, _react.default.createElement("h6", null, fileName), _react.default.createElement("p", null, "Video File Upload is complete. Press this button to upload"), _react.default.createElement("span", {
        role: "presentation",
        onClick: this.handleUpload,
        className: "iconButton uploadButton glyphicon glyphicon-arrow-up"
      }))) : _react.default.createElement("div", {
        className: "video-capture-file-input-wrapper"
      }, _react.default.createElement("p", {
        style: {
          fontSize: '1.25em'
        }
      }, "Choose a file or record from camera"), _react.default.createElement("label", {
        htmlFor: "video-capture-file-input",
        className: "custom-video-capture-file-input"
      }, "Choose File"), _react.default.createElement("input", {
        id: "video-capture-file-input",
        type: "file",
        accept: "video/*",
        value: this.state.recordedBlob || "",
        onChange: this.handleFileChange,
        className: "video-capture-file-input"
      })))));
    }
  }]);

  return MediaRecorder;
}(_react.default.Component);

var _default = (0, _reactWithMediarecorder.default)(MediaRecorder);

exports.default = _default;