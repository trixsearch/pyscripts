"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = require("react");

var useScript = function useScript(scriptUrl) {
  var removeAtUnmount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  (0, _react.useEffect)(function () {
    var script = document.createElement('script');

    if (scriptUrl !== '') {
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    return function () {
      if (scriptUrl !== '' && removeAtUnmount) {
        document.body.removeChild(script);
      }
    };
  }, [scriptUrl, removeAtUnmount]);
};

var _default = useScript;
exports.default = _default;