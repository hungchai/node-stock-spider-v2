global.config = require('./config/config.json');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var co = require('co');
var thunkify = require('thunkify');
var talib = require('talib');
var util = require('util');
console.log("TALib Version: " + talib.version);
var stockDAO = require('./DAL/stockDAO.js');
require('./Schema/stockDayQuoteSchema.js')();
require('./Schema/stockProfileSchema.js')();
//grab the stockDayquote model object

var StockDayQuoteModel = mongoose.model("StockDayQuote");
var StockProfileModel = mongoose.model("StockProfile");

var talibExecute = thunkify((parameter, callback) => {
    talib.execute(parameter, function (result) {
        callback(null, result.result);
    })
});

try {
    global.mongoURI = global.config.mongoDbConnlocal;
}
catch (err) {
    global.mongoURI = global.config.mongoDbConn;
}
mongoose.connect(global.mongoURI);
var outresult = [];
co(
    function*() {
        var stockProfiles = yield StockProfileModel.find().sort({'symbol': 1}).exec();
        //var stockquote = yield stockDAO.getStockDayQuote('00968:HK', StockDayQuoteModel);
        return stockProfiles;

    }
).then
(function (stockProfiles) {
    //console.dir(stockProfiles);
    co(
        function*() {
            for(var i = 0; i<stockProfiles.length; i++) {
                var symbol = stockProfiles[i].symbol;
                var stockquote = yield stockDAO.getStockDayQuote(symbol, StockDayQuoteModel);

                var result = yield talibExecute({
                    name: "RSI",
                    startIdx: 0,
                    endIdx: stockquote[0].closes.length - 1,
                    inReal: stockquote[0].closes,
                    optInTimePeriod: 9
                });
                if (result.outReal[result.outReal.length - 1] < 30) {
                    outresult.push({'symbol': symbol, 'sc_name':stockProfiles[i].sc ,'RSI': result.outReal[result.outReal.length - 1]});
                }
            }

            console.dir(outresult);
            process.exit(1);
        }).catch(function (err, result) {
            console.log('err: ' + err + ', result: ' + result);
        });

})
    .catch(function (err, result) {
        console.log('err: ' + err + ', result: ' + result);
        process.exit(0);

    })

//
//var stockMarketData = "https://api.investtab.com/api/quote/%s%3AHK/historical-prices?resolution=D&from=1412121600&to=1444146071"
//
//request(util.format(stockMarketData, '00700'), function(error, response, body) {
//    var marketData = JSON.parse(body);
//    talib.execute({
//        name: "SMA",
//        startIdx: 0,
//        endIdx: marketData.c.length-1,
//        inReal:marketData.c,
//        optInTimePeriod: 10
//    }, function (result) {
//        var outreal = result.result.outReal;
//        console.log("SMA(10) Function Results:");
//        console.dir(outreal.pop());
//
//    });
//});


