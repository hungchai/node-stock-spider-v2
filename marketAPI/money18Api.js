'use strict';
var cheerio = require('cheerio');
var ent = require('ent');

class StockSymbol {
    constructor(isymbol, iengName, ichiName, ilastupdate) {
        this.symbol = isymbol;
        this.engName = iengName;
        this.chiName = ichiName;
        this.lastupdate = ilastupdate;
    }

    static getHKLiveStockList() {
        return function (callback) {
            let stockListURL = "http://money18.on.cc/js/daily/stocklist/stockList_secCode.js";
            request(stockListURL, function (error, response, body) {
                var $ = cheerio.load(body);
                var stockSymbols = [];
                var M18 = {};
                M18.list = {
                    add: function (symbol, chiName, engName) {
                        var stockSymbol = new StockSymbol(symbol + ':HK', chiName, engName, new Date());
                        stockSymbols.push(stockSymbol);
                    }
                };
                eval(ent.decode(body));
                callback(error, stockSymbols);
            });

    }
    }
}

module.exports = StockSymbol;
