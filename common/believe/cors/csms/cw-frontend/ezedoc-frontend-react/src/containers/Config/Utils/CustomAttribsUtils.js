/* eslint-disable no-restricted-syntax */
export const reduceCustomAttribs = (attribs = {}) => {
  let result = {};

  for (let val in attribs) {
    if (Array.isArray(attribs[val])) {
      result[val] = attribs[val]
        .filter((item) => item)
        .map((item) => ({
          key: item.value,
          value: item.label,
        }));
    } else if (typeof attribs[val] === "object" && attribs[val]) {
      result[val] = { value: attribs[val].label, key: attribs[val].value };
    } else {
      result[val] = attribs[val] || "";
    }
  }
  return result;
};

export const mapCustomAttribs = (attribs = {}) => {
  let result = {};
  for (let val in attribs) {
    if (Array.isArray(attribs[val])) {
      result[val] = attribs[val]
        .filter((item) => item)
        .map((item) => ({
          value: item.key,
          label: item.value,
        }));
    } else if (typeof attribs[val] === "object" && attribs[val]) {
      result[val] = { label: attribs[val].value, value: attribs[val].key };
    } else {
      result[val] = attribs[val] || "";
    }
  }
  return result;
};
