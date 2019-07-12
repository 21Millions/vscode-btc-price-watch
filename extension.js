// @ts-nocheck
const vscode = require('vscode');
const axios = require('axios');
// import {TargetTreeProvider} from './src/TargetTreeProvider'
const TreeProvider = require("./src/TreeProvider");
const baseUrl = 'https://api.huobi.br.com';
let statusBarItems = {};
let coins = [];
let activateContext = null;
let updateInterval = 10000;
let timer = null;
function activate(context) {
    activateContext = context;
    init();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(handleConfigChange));

    // vscode.window.registerTreeDataProvider("targetTree1", new TargetTreeProvider());
    // context.subscriptions.push(
    //     vscode.commands.registerCommand("aemp-debugger.openPreview", (url) => {
    //         vscode.window.showInformationMessage("Hello World!");
    //     })
    // );
}

function deactivate() {

}

module.exports = {
	activate,
	deactivate
}



function formatCoinData(data) {
    let coinArr = {
        'USDT': [],
        'ETH' : [],
        'BTC' : []
    }
    data.forEach((item) => {
        const { symbol } = item;
        const coinInfo = getHuobiCoinInfo(symbol.toUpperCase());
        const trading = coinInfo[1];
        if(trading === 'ETH' || trading === 'USDT' || trading === 'BTC'){
            const newItem = {
                label: `「${coinInfo[0]}」${item.close} ${item.close > item.open ? '📈' : '📉'} ${((item.close - item.open) / item.open * 100).toFixed(2)}%`,
                icon: "star0.png",
                focus: 0,
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
    coins = getCoins();
    updateInterval = getUpdateInterval();
    fetchAllData();
    timer = setInterval(fetchAllData, updateInterval);
}

function handleConfigChange() {
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