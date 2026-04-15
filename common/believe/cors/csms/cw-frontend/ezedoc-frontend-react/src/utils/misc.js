/* eslint-disable import/no-extraneous-dependencies */
import {
  updateWith, clone, round, isNil,
} from 'lodash';
import qs from 'query-string';
import axios from 'axios'

export const cloneAndUpdate = (prevObj, path, value) => (
  updateWith(clone(prevObj), path, typeof value === 'function' ? value : () => value, clone)
);

// https://github.com/ReactTraining/react-router/issues/4841
export const concatToUrl = (base, path) => {
  const baseUrl = base.replace(/\/$/, '');
  return `${baseUrl}/${path}`;
};

export const isTrue = (val) => val === true;

export const parseQueryStr = (queryString) => {
  const queryParts = new URLSearchParams(queryString);
  const obj = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of queryParts.entries()) {
    try {
      obj[key] = JSON.parse(value);
    } catch (e) {
      obj[key] = value;
    }
  }
  return obj;
};

export const encodeToQueryStr = (obj) => {
  const queryParts = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    let encodedValue;
    if (typeof value === 'string') encodedValue = value;
    else encodedValue = JSON.stringify(value);
    if (value !== undefined) queryParts.set(key, encodedValue);
  });
  let queryString = queryParts.toString();
  if (queryString.length) queryString = `?${queryString}`;
  return queryString;
};

export const getUpdatedQuerystr = (queryStr, updates) => (
  qs.stringify({ ...qs.parse(queryStr), ...updates })
);

export const getRandStr = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;
  let result = '';
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
};

export const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

export const createPoll = (func, intervals = [1000, 2000, 4000]) => {
  /**
   * A utility to create polling request.
   *
   * @params {func} callback - the callback that will be called for
   * each poll. This should return a `Promise`. If the `Promise`
   * resolves then the poll stops otherwise the poll keeps on going.
   *
   * @params {number|number[]} intervals - to specify the poll interval.
   * This can either be a number or array of numbers.
   * In case or array of numbers, the successive intervals will use
   * the corresponding values in the arrray. Once the end of the array
   * is reached, the last values will be used forever. This can be used
   * to have poll which gradually increases the interval to a fixed value.
   *
   * @returns {object} {clear} - returns an object with `clear` method
   * to explicitly clear the internal `setTimeout`.
   */
  let timer;
  let iI = 0;
  // eslint-disable-next-line no-param-reassign
  if (!Array.isArray(intervals)) intervals = [intervals];
  const call = (timeout) => {
    if (iI < intervals.length - 1) iI++; // eslint-disable-line no-plusplus
    timer = setTimeout(() => {
      func().catch(() => call(intervals[iI]));
    }, timeout);
  };
  call(intervals[0]);
  return {
    clear: () => {
      if (timer !== undefined) clearTimeout(timer);
    },
  };
};

export const downloadLink = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
};

export const arrayBufferToExcelDownload = (arrayBuffer, name) => {
  const blob = new Blob([new Uint8Array(arrayBuffer)], {
    fileType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const fileName = `${name}.xlsx`;
  const url = URL.createObjectURL(blob);
  downloadLink(url, fileName);
};

export const roundUtil = (val) => {
  if (isNil(val)) return val;
  return round(val, 2);
};

export const currencyFormat = (val) => {
  const x = roundUtil(val);
  if (isNil(x)) return x;
  return new Intl.NumberFormat('en-IN').format(x);
};

export const currencyInWords = (val) => {
  const num = roundUtil(val);
  if (isNil(num)) return num;
  if (Math.abs(num) <= 999) {
    return Math.sign(num) * Math.abs(num);
  }
  if (Math.abs(num) <= 99999) {
    return `${Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1))}k`;
  }
  if (Math.abs(num) <= 9999999) {
    return `${Math.sign(num) * ((Math.abs(num) / 100000).toFixed(1))}lac`;
  }
  return `${Math.sign(num) * ((Math.abs(num) / 10000000).toFixed(1))}cr`;
};

export const downloadPdfToObjUrl = (url, { skipAuthorization = false }) => (
  new Promise((resolve, reject) => {
    axios.get(url, { responseType: 'arraybuffer', skipAuthorization })
      .then((res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const objUrl = URL.createObjectURL(blob);
        resolve(objUrl);
      })
      .catch(reject);
  })
);

export const downloadS3File = (file) => (
  new Promise((resolve, reject) => {
    const url = file.s3SignedURL;
    axios.get(url, { responseType: 'arraybuffer', skipAuthorization: true })
      .then((res) => {
        const blob = new Blob([res.data], { type: file.mimeType });
        const objUrl = URL.createObjectURL(blob);
        downloadLink(objUrl, file.name);
        resolve();
      })
      .catch(reject);
  })
);

export const downloadS3PDFFile = (file) => {
  downloadS3File({
    s3SignedURL: file.signedUrl,
    name: file.filename,
    mimeType: 'application/pdf',
  });
};

export const containsAlphabet = (str) => {
  const regex = /^.*[a-zA-Z]+.*$/;
  return regex.test(str);
};

export const padNumWith0 = (value, minWidth) => {
  if ((value.toString().length >= minWidth)) return value;
  return (new Array(minWidth).join('0') + value).slice(-minWidth);
};

export const flattenObjToStrings = (obj) => {
  let strings = [];
  const values = Array.isArray(obj) ? obj : Object.values(obj);
  values.forEach((val) => {
    if (typeof val === 'string') {
      strings.push(val);
    } else if (typeof val === 'object') {
      strings = strings.concat(flattenObjToStrings(val));
    }
  });
  return strings;
};

export const parseErrorResponse = (res) => {
  if (res?.errorArgs) {
    return flattenObjToStrings(res.errorArgs);
  }
  if (res?.message) return [res.message];
  return null;
};

export const objectToQueryParams = (obj) => {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export const replaceWords = (inputString, replacementMap) => {
  let result = inputString;
  for (const [target, replacement] of replacementMap.entries()) {
    const regex = new RegExp(target, 'gi'); // 'gi' flags mean global and case-insensitive
    result = result.replace(regex, replacement);
  }
  return result;
}
