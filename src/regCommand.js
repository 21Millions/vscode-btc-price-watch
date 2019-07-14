const vscode = require('vscode');
const open = require("open");
const util = require('./../src/util');
module.exports = function(context) {
    context.subscriptions.push(vscode.commands.registerCommand('coin.focus', (link) => {
        // vscode.window.showInformationMessage('Hello World！' + link);
        open(link);
    }));
};