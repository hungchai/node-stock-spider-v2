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
global.marketAPI = require('./marketAPI'), money18Api = marketAPI.money18Api, hkejApi = marketAPI.hkejApi;

global.DAL = require('./DAL'), stockDAO = DAL.stockDAO, nodeStockSpiderDAO = DAL.nodeStockSpiderDAO;

try {
    global.mongoURI = global.config.mongoDbConn;
}
catch (err) {
    global.mongoURI = global.config.mongoDbConnlocal;
}

global.mongoose.connect(global.mongoURI);

var mongoSchema = require('./Schema')
    // ,stockProfileSchema=mongoSchema.stockProfileSchema
    // ,stockDayQuoteSchema=mongoSchema.stockDayQuoteSchema;

// require('./Schema/stockProfileSchema.js')();
// require('./Schema/stockDayQuoteSchema.js')();


var argv1 = process.argv[2];
var chunk = process.argv[3];
if (chunk == null)
{
    chunk = 300; //fit 512MB ram
}
//ensure mongoose has  connected to the database already

var programLog = global.mongoose.model('ProgramLog');
var nodeStockSpiderLog = new programLog({appName: 'nodeStockSpider', beginDateTime: new Date()});
global.mongoose.connection.on("open", function(err) {
    co(function*() {
            //step 1: load live stock list
            var tmpstockSymbols = yield money18Api.getHKLiveStockList();
            //tmpstockSymbols = tmpstockSymbols.slice(1,3);
            for (i=0,j=tmpstockSymbols.length; i<j; i+=chunk) {
                var stockSymbols = tmpstockSymbols.slice(i,i+chunk);
                //stockSymbols = stockSymbols.slice(1,100);
                yield nodeStockSpiderDAO.saveStockListMongo(global.mongoose, stockSymbols)

                //step 2: load stock historical quotes
                if (argv1 == null) {
                    var getStockDayHistQuoteMap = stockSymbols.map(function(stock) {
                        return hkejApi.getstockHistDayQuoteList(stock.symbol)
                    })
                    var stockDayHistQuote = yield parallel(getStockDayHistQuoteMap, 20);
                    var saveStockDayHistQuotes = yield nodeStockSpiderDAO.saveStockDayHistQuoteMongo(mongoose, stockDayHistQuote);

                    getStockDayHistQuoteMap = null;
                    stockDayHistQuote = null;
                    saveStockDayHistQuotes = null;
                }
                //step 3: load stock today quotes
                var getstockTodayQuoteListMap = stockSymbols.map(function(stock) {
                    return hkejApi.getstockTodayQuoteList(stock.symbol);
                });

                var stockTodayQuotes = yield parallel(getstockTodayQuoteListMap, 20);

                var saveStockTodayQuoteMap = stockTodayQuotes.map(
                    function(stockTodayQuote) {
                        return nodeStockSpiderDAO.saveStockTodayQuote(mongoose, stockTodayQuote)
                    }
                )


                var saveStockTodayQuotes = yield parallel(saveStockTodayQuoteMap, 5);
                saveStockTodayQuoteMap = null;
                saveStockTodayQuotes = null;
                
                stockSymbols = null;
            }
            console.log("Transforming quota array table")
            var transformStockDayQuote = yield stockDAO.transformStockDayQuote(mongoose.model('StockDayQuote'));

            return transformStockDayQuote;

        }).then(function(val) {
            nodeStockSpiderLog.endDateTime = new Date();
            nodeStockSpiderLog.status ="C";
            nodeStockSpiderLog.save(function(err){
                 process.exit(1);
            });
           

        })
        .catch(function(err, result) {
            nodeStockSpiderLog.endDateTime = new Date();
            nodeStockSpiderLog.status ="E";
            nodeStockSpiderLog.remark(err);
            console.log('err: ' + err + ', result: ' + result);
            nodeStockSpiderLog.save(function(err){
                 process.exit(0);
            })

        });
});
