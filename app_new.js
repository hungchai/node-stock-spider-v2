global.config = require('./config/config.json');
global.mongoose = require('mongoose');
global.MongoClient = require('mongodb').MongoClient;
global.co = require('co');
global.parallel = require('co-parallel');
global.thunkify = require('thunkify');
global.util = require('util');
global.request = require('request');
global.ent = require('ent');
global._ = require("underscore");
global.stockDAO = require('./DAL/stockDAO.js');
global.money18Api = require('./marketAPI/money18Api.js');
global.hkejApi = require('./marketAPI/hkejApi.js');
var nodeStockSpiderDAO = require('./DAL/nodeStockSpiderDAO.js')

try {
    global.mongoURI = global.config.mongoDbConnlocal;
}
catch (err) {
    global.mongoURI = global.config.mongoDbConnlocal;
}

global.mongoose.connect(global.mongoURI);

require('./Schema/stockProfileSchema.js')();
require('./Schema/stockDayQuoteSchema.js')();


var argv1 = process.argv[2];
//ensure mongoose has  connected to the database already
mongoose.connection.on("open", function (err) {
    co(function*() {

        //step 1: load live stock list
        var stockSymbols = yield money18Api.getHKLiveStockList();
        yield nodeStockSpiderDAO.saveStockListMongo(global.mongoose, stockSymbols)

        //step 2: load stock historical quotes
        if (argv1 == null) {
            var getStockDayHistQuoteMap = stockSymbols.map(function (stock) {
                return hkejApi.getstockHistDayQuoteList(stock.symbol)
            })
            var stockDayHistQuote = yield parallel(getStockDayHistQuoteMap, 20);
            var saveStockDayHistQuotes = yield nodeStockSpiderDAO.saveStockDayHistQuoteMongo(global.mongoose, stockDayHistQuote);

            getStockDayHistQuoteMap = null;
            stockDayHistQuote = null;
            saveStockDayHistQuotes = null;
        }
        //step 3: load stock today quotes
        var getstockTodayQuoteListMap = stockSymbols.map(function (stock) {
            return hkejApi.getstockTodayQuoteList(stock.symbol);
        });

        var stockTodayQuotes = yield parallel(getstockTodayQuoteListMap, 20);

        var saveStockTodayQuoteMap = stockTodayQuotes.map(
            function (stockTodayQuote) {
                return nodeStockSpiderDAO.saveStockTodayQuote(mongoose, stockTodayQuote)
            }
        )
        saveStockTodayQuoteMap = null;

        var saveStockTodayQuotes = yield parallel(saveStockTodayQuoteMap, 5);
        saveStockTodayQuotes = null;
        console.log("Transforming quota array table")
        var transformStockDayQuote = yield stockDAO.transformStockDayQuote(mongoose.model('StockDayQuote'));

        return transformStockDayQuote;

    }).then
    (function (val) {
        process.exit(1);

    })
        .catch(function (err, result) {
            console.log('err: ' + err + ', result: ' + result);
            process.exit(0);

        });
});
