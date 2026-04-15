"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUrlFromFile = getUrlFromFile;
exports.convertCanvasToImage = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _browserCookies = _interopRequireDefault(require("browser-cookies"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function getUrlFromFile(_x, _x2) {
  return _getUrlFromFile.apply(this, arguments);
}

function _getUrlFromFile() {
  _getUrlFromFile = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(orgId, image) {
    var label,
        id,
        myFile,
        token,
        openForm,
        API_BASE_URL,
        USER_TOKEN,
        config,
        URL,
        res,
        blob,
        formData,
        _yield$post,
        data,
        fileJson,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            label = _args.length > 2 && _args[2] !== undefined ? _args[2] : '';
            id = _args.length > 3 ? _args[3] : undefined;
            myFile = _args.length > 4 ? _args[4] : undefined;
            token = _args.length > 5 ? _args[5] : undefined;
            openForm = _args.length > 6 ? _args[6] : undefined;
            API_BASE_URL = "".concat(process.env.REACT_APP_API_BASE_URL); // const USER_TOKEN = localStorage.getItem(token);
            // let USER_TOKEN = `Bearer ${cookies.get('access_token')}`

            if (window.location.pathname.startsWith('/org')) {
              USER_TOKEN = "JWT ".concat(localStorage.getItem('candidate_token'));
            } else {
              USER_TOKEN = "Bearer ".concat(_browserCookies.default.get('access_token'));
            }

            config = {};
            URL = "".concat(API_BASE_URL, "/").concat(orgId, "/forms/files?label=").concat(label, "&transactionId=").concat(id); // TODO Temporary way to process open forms

            if (openForm) {
              config = {
                headers: {
                  "Content-Type": "multipart/form-data"
                }
              };
              URL = "".concat(API_BASE_URL, "/").concat(orgId, "/forms/files/open?label=").concat(label, "&transactionId=").concat(id);
            } else {
              config = {
                headers: {
                  "Content-Type": "multipart/form-data",
                  "Authorization": "".concat(USER_TOKEN)
                }
              };
            }

            _context.prev = 10;
            _context.next = 13;
            return fetch(image);

          case 13:
            res = _context.sent;
            _context.next = 16;
            return res.blob();

          case 16:
            blob = _context.sent;
            formData = new FormData();
            formData.append('name', myFile.name);
            formData.append('file', blob, label);
            _context.prev = 20;
            _context.next = 23;
            return (window.location.pathname.startsWith('/org') ? _axios.default : window.axios).post(URL, formData, config);

          case 23:
            _yield$post = _context.sent;
            data = _yield$post.data;
            fileJson = [{
              storage: 'url',
              name: myFile.name,
              url: data.url,
              size: data.size,
              type: myFile.type,
              originalName: myFile.originalName,
              data: {
                url: data.url,
                baseUrl: 'https://api.form.io',
                form: '',
                project: '',
                size: data.size,
                name: myFile.originalName
              },
              isEdited: true
            }];
            return _context.abrupt("return", Promise.resolve(fileJson));

          case 29:
            _context.prev = 29;
            _context.t0 = _context["catch"](20);
            return _context.abrupt("return", Promise.reject(_context.t0));

          case 32:
            _context.next = 37;
            break;

          case 34:
            _context.prev = 34;
            _context.t1 = _context["catch"](10);
            return _context.abrupt("return", Promise.reject(_context.t1));

          case 37:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[10, 34], [20, 29]]);
  }));
  return _getUrlFromFile.apply(this, arguments);
}

var convertCanvasToImage = function convertCanvasToImage(canvas, fileType) {
  var image = new Image();
  image = canvas.toDataURL(fileType);
  return image;
};

exports.convertCanvasToImage = convertCanvasToImage;