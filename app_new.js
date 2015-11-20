global.config = require('./config/config.json');
global.mongoose = require('mongoose');
global.MongoClient = require('mongodb').MongoClient;
global.co = require('co');
global.parallel = require('co-parallel');
global.util = require('util');
global.request = require('request');
global.ent = require('ent');
global._ = require("underscore");
global.stockDAO = require('./DAL/stockDAO.js');
global.money18Api = require('./marketAPI/money18Api.js');
global.hkejApi = require('./marketAPI/hkejApi.js');
var nodeStockSpiderDAO = require('./DAL/nodeStockSpiderDAO.js')

try {
    global.mongoURI = global.config.mongoDbConnlocal2;
}
catch (err) {
    global.mongoURI = global.config.mongoDbConn;
}

global.mongoose.connect(global.mongoURI);
require('./Schema/stockProfileSchema.js')();
require('./Schema/stockDayQuoteSchema.js')();

var argv1 = process.argv[2];

co(function*() {

    var stockSymbols = yield money18Api.getHKLiveStockList();
    yield nodeStockSpiderDAO.saveStockListMongo(global.mongoose, stockSymbols)

    if (argv1 == null) {
        var getStockDayHistQuoteMap = stockSymbols.map(function (stock) {
            return hkejApi.getstockHistDayQuoteList(stock.symbol)

        })
        var stockDayHistQuote = yield parallel(getStockDayHistQuoteMap, 20);
        var saveStockDayHistQuotes = yield nodeStockSpiderDAO.saveStockDayHistQuoteMongo(global.mongoose, stockDayHistQuote);
    }


}).then
(function (val) {
    process.exit(1);

})
    .catch(function (err, result) {
        console.log('err: ' + err + ', result: ' + result);
        process.exit(0);

});
