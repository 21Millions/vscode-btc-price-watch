const vscode = require('vscode');
const axios = require('axios');
const baseUrl = 'https://api.huobi.br.com';
let statusBarItems = {};
let coins = [];
let updateInterval = 10000;
let timer = null;

function activate(context) {
    init();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(handleConfigChange));
}
exports.activate = activate;

function deactivate() {

}
exports.deactivate = deactivate;

function init(){
    coins = getCoins();
    updateInterval = getUpdateInterval();
    fetchAllData();
    timer = setInterval(fetchAllData, updateInterval);
}

function handleConfigChange(){
    timer && clearInterval(timer);
    const codes = getCoins();
    Object.keys(statusBarItems).forEach((item) => {
        if (codes.indexOf(item) === -1) {
            statusBarItems[item].hide();
            statusBarItems[item].dispose();
            delete statusBarItems[item];
        }
    });
    init();
}

function getCoins() {
    const config = vscode.workspace.getConfiguration();
    return config.get('btc-price-watch.coin');
}

function getUpdateInterval() {
    const config = vscode.workspace.getConfiguration();
    return config.get('btc-price-watch.updateInterval');
}

function fetchAllData() {
    axios.get(`${baseUrl}/market/tickers`)
        .then((rep) => {
            const result = rep.data;
            if (result.status === 'ok' && result.data.length) {
                displayData(result.data);
            }
        }).
        catch((error) => {
            console.log('超时错误');
            console.error(error);
        });
}

function getHuobiCoinInfo(symbol) {
    let trading; 
    if (symbol.substr(-3) === 'ETH') {
        trading = 'ETH';
    } else if (symbol.substr(-3) === 'BTC') {
        trading = 'BTC';
    }else if (symbol.substr(-4) === 'USDT') {
        trading = 'USD';
    }
    return [symbol.split(trading)[0], trading];
}

function displayData(data) {
    data.forEach((item) => {
        const {symbol} = item;
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

function createStatusBarItem() {
    const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    barItem.text = '';
    barItem.show();
    return barItem;
}