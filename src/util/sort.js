/**
 * @调用 arr.sort(sortObj("age"))
 * @param {string} propertyName 属性名称
 * @param {string} sortType asce = 升序，desc = 降序
 */
const sortObj = (propertyName, sortType = 'asce') => {
  return (obj1, obj2) => {
    let val1 = obj1[propertyName];
    let val2 = obj2[propertyName];
    if (val2 < val1) {
      return sortType === 'asce' ? -1 : 1;
    } else if (val2 > val1) {
      return sortType === 'asce' ? 1 : -1;
    } else {
      return 0;
    }
  }
}

module.exports = sortObj;
