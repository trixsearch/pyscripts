"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StorageFileRemover = exports.SeparateFiles = exports.FormCommonOnChange = void 0;

var _browserCookies = _interopRequireDefault(require("browser-cookies"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Common OnChange Function for FORMIO forms
// Inputs
// e - event, instance - instance of the component, getter1 - filesUploaded variable, getter2 - fileKeys variable, setter1 - setter of filesUploaded, setter2 - setter of fileKeys, callback - callback function
var FormCommonOnChange = function FormCommonOnChange(e, instance, getter1, getter2, setter1, setter2) {
  var callback = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;
  // Only Capturing File Uploads
  var isFileUpload = e && e.changed && e.changed.instance && e.changed.value.length > 0 && e.changed.instance.type === 'file' || false;

  if (isFileUpload) {
    var isFileUrlType = e.changed.value[0].storage === 'url';

    if (isFileUrlType) {
      var filesUploaded = instance ? instance.state.filesUploaded : getter1;
      var fileComponentKeys = instance ? instance.state.fileComponentKeys : getter2;
      var currentFilesUploaded = new Set(filesUploaded);
      var fileUploadedComponentKey = e.changed.component.key;

      if (fileComponentKeys.indexOf(fileUploadedComponentKey) === -1) {
        fileComponentKeys.push(fileUploadedComponentKey);
      }

      e.data[fileUploadedComponentKey] && Array.isArray(e.data[fileUploadedComponentKey]) && e.data[fileUploadedComponentKey].length > 0 && e.data[fileUploadedComponentKey].map(function (file) {
        currentFilesUploaded.add(file.url);
        return null;
      });

      if (instance) {
        instance.setState({
          filesUploaded: currentFilesUploaded,
          fileComponentKeys: fileComponentKeys
        }, function () {
          if (callback && typeof callback === 'function') callback();
        });
      } else {
        setter1(currentFilesUploaded);
        setter2(fileComponentKeys);
      }
    }
  }
}; // Inputs => fileKeys - Array, files - Set, data - Object (form data) 
// Output => Object of non-deleted files & deleted files


exports.FormCommonOnChange = FormCommonOnChange;

var SeparateFiles = function SeparateFiles(fileKeys, files, data) {
  var fileSetToBeRetained = new Set();
  var fileSetToBeDeleted = new Set(files);

  if (files.size > 0) {
    var exp1 = Object.keys(data).map(function (item) {
      if (fileKeys.indexOf(item) !== -1) {
        if (data[item] && Array.isArray(data[item]) && data[item].length > 0) {
          var exp2 = data[item].map(function (file) {
            if (files.has(file.url)) {
              fileSetToBeRetained.add(file.url);
              fileSetToBeDeleted.delete(file.url);
            }

            return null;
          });
        }
      }

      return null;
    });
  }

  return {
    fileSetToBeRetained: fileSetToBeRetained,
    fileSetToBeDeleted: fileSetToBeDeleted
  };
}; // Inputs => fileSetToBeDeleted - A set contains the url of files to be deleted, savedLocalStorageData - localStorage data in the format of Object


exports.SeparateFiles = SeparateFiles;

var StorageFileRemover = function StorageFileRemover(fileSetToBeDeleted) {
  var savedLocalStorageData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  if (fileSetToBeDeleted.size > 0) {
    fileSetToBeDeleted.forEach(function (url) {
      var modifiedUrl = url.substring(url.indexOf('/hire'));
      var tokenName = window.location.pathname.startsWith('/org') ? 'token' : 'candidate_token';
      var token = '';
      if (savedLocalStorageData) token = "JWT " + savedLocalStorageData[tokenName];else token = "JWT " + localStorage.getItem(tokenName);

      if (window.location.pathname.startsWith('/org')) {
        token = "JWT ".concat(localStorage.getItem('candidate_token'));
      } else {
        token = "Bearer ".concat(_browserCookies.default.get('access_token'));
      }

      fetch(modifiedUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': "".concat(token)
        }
      });
    });
  }
};

exports.StorageFileRemover = StorageFileRemover;