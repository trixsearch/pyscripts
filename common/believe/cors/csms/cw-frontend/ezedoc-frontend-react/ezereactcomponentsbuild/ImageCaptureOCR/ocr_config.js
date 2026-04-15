"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _core = _interopRequireDefault(require("@uppy/core"));

var _axios = _interopRequireDefault(require("axios"));

var _browserCookies = _interopRequireDefault(require("browser-cookies"));

var _Utils = require("./Utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultUppyConfig = {
  restrictions: {
    maxNumberOfFiles: 1,
    maxFileSize: 5242880,
    // 5 MB
    allowedFileTypes: ["image/jpeg", "image/jpg", "image/png"]
  },
  autoProceed: true
};
var USER_TOKEN = '';
var defaultVariables = {
  camera: true,
  fileId: "",
  file: null,
  upload: false,
  cropperSrc: "",
  cropper: false,
  serverUrl: "",
  uppyInstance: null,
  previewURL: ""
};

var handleError = function handleError(error) {
  try {
    if (error.response && error.response.data) {
      if (error.response.status > 500) {
        return "Error: ".concat(error.response.status, ", please retry after sometime.");
      }

      return error.response.data.message || "Error: ".concat(error.response.status, ", please retry after sometime.");
    }

    return error.message;
  } catch (exception) {
    return "Something went wrong, please try after sometime.";
  }
};

var _default = {
  aadhaar: {
    aadhaarFront: null,
    aadhaarBack: null,
    aadharCardFrontImg: "",
    aadharCardBackImg: "",
    initialState: {
      cameraEnabled: true,
      isCamera: (0, _Utils.isMobile)(),
      components: [_objectSpread({
        id: "aadharCardFront",
        name: "Aadhaar Card Front"
      }, defaultVariables), _objectSpread({
        id: "aadharCardBack",
        name: "Aadhaar Card Back"
      }, defaultVariables)]
    },
    cameraConfig: {// TODO
    },
    init: function init(handleUpload) {
      var _this = this;

      // Aadhaar Card Front
      this.aadhaarFront = (0, _core.default)(_objectSpread({}, defaultUppyConfig));
      this.initialState.components[0].uppyInstance = this.aadhaarFront;
      this.aadhaarFront.on("file-added", function (result) {
        _this.aadharCardFrontImg = result === null || result === void 0 ? void 0 : result.data;
        handleUpload({
          successful: [result]
        }, "aadharCardFront");
      }); // Aadhaar Card Back

      this.aadhaarBack = (0, _core.default)(_objectSpread({}, defaultUppyConfig));
      this.initialState.components[1].uppyInstance = this.aadhaarBack;
      this.aadhaarBack.on("file-added", function (result) {
        _this.aadharCardBackImg = result === null || result === void 0 ? void 0 : result.data;
        handleUpload({
          successful: [result]
        }, "aadharCardBack");
      });
    },
    submit: function submit(submitConfig) {
      var API_BASE_URL = "".concat(process.env.REACT_APP_API_BASE_URL);
      var orgId = submitConfig.orgId,
          files = submitConfig.files,
          setStatus = submitConfig.setStatus,
          token = submitConfig.token,
          transactionId = submitConfig.transactionId,
          onComplete = submitConfig.onComplete,
          openform = submitConfig.openform;
      var AADHAAR_OCR_URL = "".concat(API_BASE_URL, "/").concat(orgId, "/proxy-apps/ocr");
      var aadharFrontFile = files[0];
      var aadharBackFile = files[1];
      Promise.all([(0, _Utils.imageToBase64Converter)(this.aadharCardFrontImg), (0, _Utils.imageToBase64Converter)(this.aadharCardBackImg)]).then(function (res) {
        setStatus({
          message: "Fetching OCR Data."
        });
        var data = {
          card_type: 'AADHAAR',
          card_front_image: res[0].slice(res[0].indexOf(',') + 1),
          card_back_image: res[1].slice(res[1].indexOf(',') + 1)
        };

        if (window.location.pathname.startsWith('/org')) {
          USER_TOKEN = "JWT ".concat(localStorage.getItem('candidate_token'));
        } else {
          USER_TOKEN = "Bearer ".concat(_browserCookies.default.get('access_token'));
        }

        Promise.all([_axios.default.post(AADHAAR_OCR_URL, data, {
          headers: {
            Authorization: USER_TOKEN
          }
        }), (0, _Utils.getUrlFromFile)(orgId, aadharFrontFile, "Aadhaar Card Front", transactionId, token, openform), (0, _Utils.getUrlFromFile)(orgId, aadharBackFile, "Aadhaar Card Back", transactionId, token, openform)]).then(function (res) {
          var _res$, _res$$data, _res$$data$data, _res$$data$data$resul;

          setStatus({
            message: "",
            loader: false
          });
          onComplete({
            ocrData: _objectSpread({}, (_res$ = res[0]) === null || _res$ === void 0 ? void 0 : (_res$$data = _res$.data) === null || _res$$data === void 0 ? void 0 : (_res$$data$data = _res$$data.data) === null || _res$$data$data === void 0 ? void 0 : (_res$$data$data$resul = _res$$data$data.result) === null || _res$$data$data$resul === void 0 ? void 0 : _res$$data$data$resul.card_info),
            file: [res[1], res[2]]
          });
        }).catch(function (err) {
          setStatus({
            message: handleError(err),
            loader: false
          });
        });
      }).catch(function (err) {
        setStatus({
          loader: false,
          message: handleError(err)
        });
      });
    },
    close: function close() {
      // close uppy instances
      this.aadhaarFront.close();
      this.aadhaarBack.close();
    }
  },
  // Config for Pan Card
  pan: {
    panCard: null,
    panCardImg: '',
    initialState: {
      cameraEnabled: true,
      isCamera: (0, _Utils.isMobile)(),
      components: [_objectSpread({
        id: "panCard",
        name: "Pan Card"
      }, defaultVariables)]
    },
    cameraConfig: {// TODO
    },
    init: function init(handleUpload) {
      var _this2 = this;

      // Pan Card
      this.panCard = (0, _core.default)(_objectSpread({}, defaultUppyConfig));
      this.initialState.components[0].uppyInstance = this.panCard;
      this.panCard.on("file-added", function (result) {
        _this2.panCardImg = result === null || result === void 0 ? void 0 : result.data;
        handleUpload({
          successful: [result]
        }, "panCard");
      });
    },
    submit: function submit(submitConfig) {
      var API_BASE_URL = "".concat(process.env.REACT_APP_API_BASE_URL);
      var orgId = submitConfig.orgId,
          files = submitConfig.files,
          setStatus = submitConfig.setStatus,
          token = submitConfig.token,
          transactionId = submitConfig.transactionId,
          onComplete = submitConfig.onComplete,
          openform = submitConfig.openform;
      var PAN_OCR_URL = "".concat(API_BASE_URL, "/").concat(orgId, "/proxy-apps/ocr"); // const pan_url = "https://s3.ap-south-1.amazonaws.com/static.ezedox/temp/pan_front_pm.jpg";

      (0, _Utils.imageToBase64Converter)(this.panCardImg).then(function (res) {
        setStatus({
          message: "Fetching OCR Data ... "
        });
        var PAYLOAD = {
          card_type: 'PAN',
          card_front_image: res.slice(res.indexOf(',') + 1),
          card_back_image: ""
        };

        if (window.location.pathname.startsWith('/org')) {
          USER_TOKEN = "JWT ".concat(localStorage.getItem('candidate_token'));
        } else {
          USER_TOKEN = "Bearer ".concat(_browserCookies.default.get('access_token'));
        }

        Promise.all([_axios.default.post(PAN_OCR_URL, PAYLOAD, {
          headers: {
            Authorization: USER_TOKEN
          }
        }), (0, _Utils.getUrlFromFile)(orgId, files[0], "Pan Card", transactionId, token, openform)]).then(function (res) {
          var _res$2, _res$2$data, _res$2$data$data, _res$2$data$data$resu;

          setStatus({
            message: "",
            loader: false
          });
          onComplete({
            ocrData: (_res$2 = res[0]) === null || _res$2 === void 0 ? void 0 : (_res$2$data = _res$2.data) === null || _res$2$data === void 0 ? void 0 : (_res$2$data$data = _res$2$data.data) === null || _res$2$data$data === void 0 ? void 0 : (_res$2$data$data$resu = _res$2$data$data.result) === null || _res$2$data$data$resu === void 0 ? void 0 : _res$2$data$data$resu.card_info,
            file: [res[1], res[2]]
          });
        }).catch(function (err) {
          setStatus({
            message: handleError(err),
            loader: false
          });
        });
      });
    },
    close: function close() {
      // close uppy instances
      this.panCard.close();
    }
  }
};
exports.default = _default;