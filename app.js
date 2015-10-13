global.config = require('./config/config.json');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var co = require('co');
var parallel = require('co-parallel');
var util = require('util');
var buf = require("buffer");
var request = require('request');

global.mongoURI = global.config.mongoDbConn;

//mongoose.connect(config[config.mongoDbConn[0]].URI);
//sss
//step 1
var stockListURL = 'https://api.investtab.com/api/search?limit=5000&query=hk&chart_only=false&type=stock';
var stockMinutesQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockHistDayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart';
var stockTodayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/todaydata';
var stockInfoURL = 'https://api.investtab.com/api/quote/%s/info';
// registering remote methods

function getStockList() {
    return function (callback) {
        request(stockListURL, function (error, response, body) {
            callback(error, JSON.parse(body));
        });

    };
};
//e.g: stockSymbol = 00700.HK
function getStockInfo(stockSymbol) {
    return function (callback) {
        request(util.format(stockInfoURL, stockSymbol), function (error, response, body) {
            console.log("getStockInfo:" + util.format(stockInfoURL, stockSymbol));
            if (error || response.statusCode != 200) {
                console.log("receive:" + util.format(stockInfoURL, stockSymbol));
                callback(error, NaN);
            } else {
                console.log("receive:" + util.format(stockInfoURL, stockSymbol));
                callback(error, JSON.parse(body));
            }
        });

    };
}
//e.g: stockNum = 700
function stockMinQuoteList(stockNum) {
    return function (callback) {
        request(util.format(stockMinQuoteURL, parseInt(stockNum)), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(error, JSON.parse(body));
            }
        })

    };
}

function stockHistDayQuoteList(stockNum) {
    return function (callback) {
        var formBody = util.format('code=%s&period=day&frame=2+YEAR', parseInt(stockNum));
        var contentLength = formBody.length;
        request({
            headers: {
                'Content-Length': contentLength,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': util.format('http://stock360.hkej.com/quotePlus/%s', stockNum)
            },
            uri: stockHistDayQuoteURL,
            body: formBody,
            method: 'POST'
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(error, JSON.parse(body));
            }
        })

    }
}

function saveStockListMongo(stocks, db) {
    return function (callback) {
        var data = stocks;
//        MongoClient.connect(global.mongoURI, function(err, db) {
        var lastupdate = new Date();
        var stockProfile2Collection = db.collection('stockProfile');
        var bulk = stockProfile2Collection.initializeUnorderedBulkOp({
            useLegacyOps: true
        });
        for (var i = 0, len = data.length; i < len; i++) {
            data[i]["lastupdate"] = lastupdate;
            //batch.insert(data[i]);
            bulk.find({
                symbol: data[i].symbol,
            }).upsert().replaceOne(
                data[i]
            );

        }
        bulk.execute(function (err, result) {
            console.log(result.nInserted);
            callback(err, result);
        });
    }
}

function saveStockInfoMongo(stockInfos, db) {
    return function (callback) {
        var data = stockInfos;
        //MongoClient.connect(global.mongoURI, function(err, db) {
        //var lastupdate = new Date();
        var stockProfile2Collection = db.collection('stockProfile');
        var bulk = stockProfile2Collection.initializeUnorderedBulkOp({
            useLegacyOps: true
        });
        for (var i = 0, len = data.length; i < len; i++) {
            var info = {};
            var apiData = data[i];
            console.log('symbol:'+apiData.symbol);

            //sector transform
            if ((apiData.sector))
            {
                var sector_id = Object.keys(apiData.sector)[0];
                info.sector = {};
                for (var sectorkey in apiData.sector[sector_id]) {
                    info.sector[sectorkey] = apiData.sector[sector_id][sectorkey];
                }
            }

            //sub industry transform
            if ((apiData.sub_industry)) {
                var sub_industry_id = Object.keys(apiData.sub_industry)[0];
                info.sub_industry = {};
                for (var sub_industry_key in apiData.sub_industry[sub_industry_id]) {
                    info.sub_industry[sub_industry_key] = apiData.sub_industry[sub_industry_id][sub_industry_key];
                }
            }
            // industry transform
            if ((apiData.industry)) {
                var industry_id = Object.keys(apiData.industry)[0];
                info.industry = {};
                for (var industry_key in apiData.industry[industry_id]) {
                    info.industry[industry_key] = apiData.industry[industry_id][industry_key];
                }
            }

            info.trading_currency = apiData.trading_currency;
            info.board_amount = apiData.board_amount;
            info.par_currency = apiData.par_currency;
            info.stock_type = apiData.stock_type;
            info.fin_year = apiData.fin_year;
            info.listing_date = apiData.listing_date;
            info.exchange = apiData.exchange;
            info.board_lot = apiData.board_lot;
            info.instrument_class = apiData.instrument_class;

            //batch.insert(data[i]);
            bulk.find({
                symbol: data[i].symbol

            }).update({
                $set: {
                    info: info
                },
                $currentDate: {
                    lastupdate: true
                }
            });
        }
        bulk.execute(function (err, result) {
            console.log(result.nInserted);
            callback(err, result);
        });


    }
    //})
}

MongoClient.connect(global.mongoURI, function (err, db) {
    co(function*() {

        var test = yield stockHistDayQuoteList('700');

        var stocks = (yield getStockList());
        var saveStocks = yield saveStockListMongo(stocks, db);
        //stocks = stocks.slice(0,6);
        var getStockInfoMap = stocks.map(function (stock) {
            return getStockInfo(stock.symbol);
        })
        var stockInfos = yield parallel(getStockInfoMap, 20);
        var saveStockInfos = yield saveStockInfoMongo(stockInfos, db)
        //

        var p2 = stocks.map(function (stockObj) {
            return stockMinQuoteList(parseInt(stockObj.symbol));
        });
        //var res = yield parallel(p2, 4);
        //console.log(JSON.stringify(res))


    }).catch(function (err, result) {
        console.log('err: ' + err + ', result: ' + result);
    })
})
