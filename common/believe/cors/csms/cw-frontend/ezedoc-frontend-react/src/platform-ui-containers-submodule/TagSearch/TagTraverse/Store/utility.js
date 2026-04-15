export const updateObject = (oldObject, updatedProperties) => ({
  ...oldObject,
  ...updatedProperties,
});

export const insertItemInArray = (array, newItem) => {
  const newArray = array.slice();
  newArray.splice(array.length + 1, 0, newItem);
  return newArray;
};

export const removeItemsInArray = (array, targetIndex) => array.filter((item, index) => index <= targetIndex);
