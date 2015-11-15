'use strict';
var cheerio = require('cheerio');
var ent = require('ent');

class StockSymbol {
    constructor(symbol, engName, chiName) {
        this._symbol = symbol;
        this._engName = engName;
        this._chiName = chiName;
    }

    get symbol() {
        return this._symbol;
    }

    set symbol(n) {
        this._symbol = n;
    }

    get engName() {
        return this._engName;
    }

    set engName(n) {
        this._engName = n;
    }

    get chiName() {
        return this._chiName;
    }

    set chiName(n) {
        this._chiName = n;
    }
}
module.exports.StockSymbol = StockSymbol;
module.exports.getHKLiveStockList = function () {
    return function (callback) {
        let stockListURL = "http://money18.on.cc/js/daily/stocklist/stockList_secCode.js";
        request(stockListURL, function (error, response, body) {
            var $ = cheerio.load(body);
            var stockSymbols = [];
            var M18 = {};
            M18.list = {
                add: function (symbol, chiName, engName) {
                    var stockSymbol = new StockSymbol(symbol + ':HK', chiName, engName);
                    stockSymbols.push(stockSymbol);
                }
            };
            eval(ent.decode(body));
            callback(error, stockSymbols);
        });
    };
}