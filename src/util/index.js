const vscode = require('vscode');
const util = {
  /**
   * @调用 arr.sort(util.sortObj("age"))
   * @param {string} propertyName 属性名称
   * @param {string} sortType asce = 升序，desc = 降序
   */
  sortObj(propertyName, sortType = 'asce') {
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
  },
  /**
   * 获取配置文件的监听币种
   */
  getConfigurationCoin() {
    const config = vscode.workspace.getConfiguration();
    return config.get('btc-price-watch.coin');
  },
  /**
   * 获取配置文件的更新时间
   */
  getConfigurationTime() {
    const config = vscode.workspace.getConfiguration();
    return config.get('btc-price-watch.updateInterval');
  }
}

module.exports = util;