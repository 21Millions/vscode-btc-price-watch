const vscode = require('vscode');
const axios = require('axios');
const util = require('./util');
const {GET_EXCHANGE_INFO} = require('./config/index');


class App {
    constructor(context){
        this.activateContext = context;
        this.statusBarItems = {};
        this.coins = util.getConfigurationCoin();
        this.updateInterval = util.getConfigurationTime();
        this.timer = null;
        this.API_ADDRESS = ''; // 交易对地址
        this.HUOBI_LINK = ''; // 火币网真实交易地址
        this.init();
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => this.handleConfigChange()));
    }
    /*
     * 配置文件改变触发
     */
    handleConfigChange() {
    	this.reload();
        this.timer && clearInterval(this.timer);
        this.init();
    }

	reload(){
		/*删除所有的元素 */
		Object.keys(this.statusBarItems).forEach((item) => {

		                this.statusBarItems[item].hide();
		                this.statusBarItems[item].dispose();
		                delete this.statusBarItems[item];

		        });

		const codes = util.getConfigurationCoin();
		codes.forEach((item) => {
		    this.statusBarItems[item] = this.createStatusBarItem(item);
		});

	}
     /**
     * 创建statusBar
     * @param {string} text
     */
    createStatusBarItem(text = 'loading...') {
        const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        barItem.text = text;
        barItem.show();
        return barItem;
    }
    /**
     * 获取接口数据
     */
    fetchAllData() {
        // @ts-ignore
        axios.get(this.API_ADDRESS)
        .then((rep) => {
            const result = rep.data;
            if (result.status === 'ok' && result.data.length) {
                this.updateStatusBar(result.data);
            }
        }).
        catch((error) => {
            console.error(error);
        });
    }


    /*
     * 更新底部 StatusBar
     */
    updateStatusBar(data) {
        data.forEach((item) => {
            const { symbol } = item;
            const coinInfo = util.getHuobiCoinInfo(symbol.toUpperCase());
            if (this.coins.indexOf(symbol) !== -1) {
                const statusBarItemsText = `${coinInfo[0]}: ${item.close} ${((item.close - item.open) / item.open * 100).toFixed(2)}%`;
                if (this.statusBarItems[symbol]) {
                    this.statusBarItems[symbol].text = statusBarItemsText;
                }
            }
        });
    }

    /**
     * 动态获取交易所api地址
     */
    watcher(){
        /* 每次init重新更新配置文件的内容 */
        this.coins = util.getConfigurationCoin();
        this.updateInterval = util.getConfigurationTime()

        this.fetchAllData();
        this.timer = setInterval(() => {
            this.fetchAllData();
        }, this.updateInterval);
    }
    init() {
        // @ts-ignore
        axios.get(GET_EXCHANGE_INFO)
        .then((res) => {
            this.API_ADDRESS = res.data.API_ADDRESS;
            this.HUOBI_LINK = res.data.HUOBI_LINK;
            this.watcher();
        })
    }
}
module.exports = App;