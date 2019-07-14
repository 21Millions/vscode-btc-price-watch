const vscode = require('vscode');
const axios = require('axios');
const util = require('./../src/util');
const {API_ADDRESS} = require('./../src/config/index');
const TreeProvider = require("./../src/TreeProvider");
let statusBarItems = {};
let coins = [];
let activateContext = null;
let updateInterval = 10000;
let timer = null;

module.exports = function(context) {
    activateContext = context;
    init();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(handleConfigChange));
    vscode.window.showInformationMessage("Hello World!");
    
    function addCoinNameLen(_str) {
        const len = 5 - _str.length;
        const emptyStr = new Array(len+1).join('');
        return `${_str}${emptyStr}`;
    }

    function formatCoinData(data) {
        data = data.sort(util.sortObj("close"));
        let coinArr = {
            'USDT': [],
            'ETH' : [],
            'BTC' : []
        }
        data.forEach((item) => {
            const { symbol } = item;
            const coinInfo = getHuobiCoinInfo(symbol.toUpperCase());
            const trading = coinInfo[1];
            const isFocus = true ? 0 : 1;
            if(trading === 'ETH' || trading === 'USDT' || trading === 'BTC'){
                const newItem = {
                    label: `「${addCoinNameLen(coinInfo[0])}」${item.close} ${item.close > item.open ? '📈' : '📉'} ${((item.close - item.open) / item.open * 100).toFixed(2)}%`,
                    icon: `star${isFocus}.png`,
                    symbol: symbol,
                    extension: "lucky.gao.extension.start_dev"
                }
                coinArr[trading].push(newItem);
            }
        });
        return coinArr;
    }

    function updateActivityBar(data) {
        const coinData = formatCoinData(data);
        console.log(coinData['USDT']);
        let provider = new TreeProvider(vscode.workspace.rootPath, coinData['USDT'], activateContext);
        vscode.window.registerTreeDataProvider("USDT", provider);
    }

    function init() {
        console.log('init');
        coins = util.getConfigurationCoin();
        updateInterval = util.getConfigurationTime();

        fetchAllData();
        timer = setInterval(fetchAllData, updateInterval);
    }

    function handleConfigChange() {
        timer && clearInterval(timer);
        const codes = util.getConfigurationCoin();
        Object.keys(statusBarItems).forEach((item) => {
            if (codes.indexOf(item) === -1) {
                statusBarItems[item].hide();
                statusBarItems[item].dispose();
                delete statusBarItems[item];
            }
        });
        init();
    }

    function fetchAllData() {
        // @ts-ignore
        axios.get(API_ADDRESS)
            .then((rep) => {
                const result = rep.data;
                if (result.status === 'ok' && result.data.length) {
                    updateStatusBar(result.data);
                    updateActivityBar(result.data);
                }
            }).
            catch((error) => {
                console.log(statusBarItems['error'] == null);
                if (statusBarItems['error'] == null) {
                    statusBarItems['error'] = createStatusBarItem(`错误${error}`);
                    console.error(error);
                }
            });
    }

    function getHuobiCoinInfo(symbol) {
        let trading;
        if (symbol.substr(-3) === 'ETH') {
            trading = 'ETH';
        } else if (symbol.substr(-3) === 'BTC') {
            trading = 'BTC';
        } else if (symbol.substr(-4) === 'USDT') {
            trading = 'USDT';
        }
        return [symbol.split(trading)[0], trading];
    }

    function updateStatusBar(data) {
        data.forEach((item) => {
            const { symbol } = item;
            const coinInfo = getHuobiCoinInfo(symbol.toUpperCase());
            if (coins.indexOf(symbol) !== -1) {
                if (statusBarItems[symbol]) {
                    statusBarItems[symbol].text = `「${coinInfo[0]}」${item.close} ${coinInfo[1]} ${item.close > item.open ? '📈' : '📉'} ${((item.close - item.open) / item.open * 100).toFixed(2)}%`;
                } else {
                    statusBarItems[symbol] = createStatusBarItem();
                }
            }
        });
    }

    function createStatusBarItem(text = '') {
        const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        barItem.text = text;
        barItem.show();
        return barItem;
    }
};