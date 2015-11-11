global.config = require('./config/config.json');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var co = require('co');
var thunkify = require('thunkify');
var talib = require('talib');
var util = require('util');
var _ = require("underscore");
var json2xls = require('json2xls');
var fs = require('fs');

console.log("TALib Version: " + talib.version);
var stockDAO = require('./DAL/stockDAO.js');
require('./Schema/stockDayQuoteSchema.js')();
require('./Schema/stockProfileSchema.js')();
require('./Schema/stockQuotesArray.js')();
//grab the stockDayquote model object

var StockDayQuoteModel = mongoose.model("StockDayQuote");
var StockProfileModel = mongoose.model("StockProfile");
var StockQuotesArrayModel = mongoose.model("StockQuotesArray");

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
var rsi_outresult = [];
var macd_outresult = [];
var CDL3OUTSIDE_result = [];
var rsi_lt30_macd_nv_outresult = [];
co(
    function*() {
        var stockQuotesArrays = yield StockQuotesArrayModel.find().exec();
        //var stockquote = yield stockDAO.getStockDayQuote('00968:HK', StockDayQuoteModel);
        return _.sortBy(stockQuotesArrays, '_id');

    }
).then
(function (stockQuotesArrays) {
    //console.dir(stockProfiles);
    co(
        function*() {
            for (var i = 0; i < stockQuotesArrays.length; i++) {
                var symbol = stockQuotesArrays[i]._id;
                console.log('Progress: ' + symbol);
                var stockProfile = yield StockProfileModel.findOne({'symbol': symbol}).exec();
                //   var stockquote = yield stockDAO.getStockDayQuote(symbol, StockDayQuoteModel);
                var stockquote = stockQuotesArrays[i];
                var rsiresult = yield talibExecute({
                    name: "RSI",
                    startIdx: 0,
                    endIdx: stockquote.closes.length - 1,
                    inReal: stockquote.closes,
                    optInTimePeriod: 9
                });
                //if (rsiresult.outReal[rsiresult.outReal.length - 1] < 30) {
                //    rsi_outresult.push({
                //        'symbol': symbol,
                //        'sc_name': stockProfile.sc,
                //        'currentQuote': stockquote.closes[stockquote.closes.length - 1],
                //        'RSI': result.outReal[result.outReal.length - 1]
                //    });
                //}

                var resultMACD = yield talibExecute({
                    name: "MACD",
                    startIdx: 0,
                    endIdx: stockquote.closes.length - 1,
                    inReal: stockquote.closes,
                    optInFastPeriod: 3,
                    optInSlowPeriod: 50,
                    optInSignalPeriod: 10
                });
                var totalCnt = parseInt(resultMACD.outMACD.length);
                if (rsiresult.outReal[rsiresult.outReal.length - 1] < 20
                    && resultMACD.outMACDHist[totalCnt - 1] < resultMACD.outMACDHist[totalCnt - 2] - 0.03 && resultMACD.outMACDHist[totalCnt - 2] <= 0) {
                    rsi_lt30_macd_nv_outresult.push({
                        'symbol': symbol,
                        'sc_name': stockProfile.sc,
                        'currentQuote': stockquote.closes[stockquote.closes.length - 1],
                        'outMACDHist': resultMACD.outMACDHist[totalCnt - 1],
                        'rsi': rsiresult.outReal[rsiresult.outReal.length - 1]
                    });
                }

                var resultCDL3OUTSIDE = yield talibExecute({
                    name: "CDL3OUTSIDE",
                    startIdx: 0,
                    endIdx: stockquote.closes.length - 1,
                    high: stockquote.highs,
                    low: stockquote.lows,
                    close: stockquote.closes,
                    open: stockquote.opens,
                    optInTimePeriod: 9
                });
                if (resultCDL3OUTSIDE) {
                    var totalCnt = parseInt(resultCDL3OUTSIDE.outInteger.length);
                    CDL3OUTSIDE_result.push({
                        'symbol': symbol,
                        'sc_name': stockProfile.sc,
                        'CDL3OUTSIDE': resultCDL3OUTSIDE.outInteger[totalCnt - 1]
                    })
                }
            }
            //console.dir(macd_outresult);
            var CDL3outside_xls = json2xls(CDL3OUTSIDE_result);
            fs.writeFileSync('/users/tomma/Desktop/CDL3outside.xlsx', CDL3outside_xls, 'binary');
            var rsi_lt30_macd_nv_outresultxls = json2xls(rsi_lt30_macd_nv_outresult);
            fs.writeFileSync('/users/tomma/Desktop/rsilt30_macdnve.xlsx', rsi_lt30_macd_nv_outresultxls, 'binary');

            //console.dir(rsi_outresult);
            process.exit(1);
        }).catch(function (err, result) {
            console.log('err: ' + err + ', result: ' + result);
        });

})
    .catch(function (err, result) {
        console.log('err: ' + err + ', result: ' + result);
        process.exit(0);

    })
    .catch(function (err, result) {
        console.log('err: ' + err + ', result: ' + result);
    });

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


