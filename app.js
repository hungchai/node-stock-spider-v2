global.config = require('./config/config.json');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var co = require('co');
var parallel = require('co-parallel');
var util = require('util');
var buf = require("buffer");
var request = require('request');
var cheerio = require('cheerio');
var ent = require('ent');
var _ = require("underscore");

global.mongoURI = global.config.mongoDbConn;

//mongoose.connect(config[config.mongoDbConn[0]].URI);
//sss
//step 1
//var stockListURL = 'https://api.investtab.com/api/search?limit=3000&query=hk&chart_only=false&type=stock';
var stockListURL = "http://money18.on.cc/js/daily/stocklist/stockList_secCode.js"
var stockMinutesQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockHistDayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart';
var stockTodayQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/todaydata?code=%s';
var stockInfoURL = 'https://api.investtab.com/api/quote/%s/info';
// registering remote methods
//
//function getStockList() {
//    return function (callback) {
//        request(stockListURL, function (error, response, body) {
//            callback(error, JSON.parse(body));
//        });
//
//    };
//};

function getStockList() {
    return function (callback) {
        request(stockListURL, function (error, response, body) {
            var $ = cheerio.load(body);
            var stocks = [];
            var M18 = {};
            M18.list = {
                add: function (symbol, chiName, engName) {
                    var stock = {};
                    stock.symbol = symbol + ':HK';
                    stock.sc = chiName;
                    stock.en = engName;
                    stocks.push(stock);
                }
            };
            eval(ent.decode(body));
            callback(error, stocks);

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
                callback(error, null);
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

function getStockQuoteList(stockNum, parameter, callback) {
    return function (callback) {
        console.log("getStockQuoteList: " + stockNum);
        var formBody = util.format('code=%s&%s', parseInt(stockNum), parameter);
        var contentLength = formBody.length;
        request({
            headers: {
                'Content-Length': contentLength,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': util.format('http://stock360.hkej.com/quotePlus/%s', parseInt(stockNum))
            },
            uri: stockHistDayQuoteURL,
            body: formBody,
            method: 'POST'
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("receive: " + stockNum);
                var d = JSON.parse(body);
                d.symbol = stockNum
                callback(error, d);
            }else
            {
                callback(null, null);
            }
        })

    }
}
function getstockHistDayQuoteList(stockNum) {
    return function (callback) {
        getStockQuoteList(stockNum, 'period=day&frame=2+YEAR')(callback);
    }
}

function saveStockDayHistQuoteMongo(stockDayQuoteList, db) {
    return function (callback) {
        var rowdata = stockDayQuoteList;
//        MongoClient.connect(global.mongoURI, function(err, db) {
        var lastupdate = new Date();
        var stockDayQuoteCollection = db.collection('stockDayQuote');
        var errmsg;
//remove null object
        var data = _.filter(stockDayQuoteList, function(stockDayQuote){ return stockDayQuote != null; });

        co(function*() {
            for (var i = 0, len = data.length; i < len; i++) {
                var stocksymbol = data[i].symbol;
                var stockDataset = data[i].dataset;
                console.log('start handle dataset of symbol:' + data[i].symbol);

                if (stockDataset != null && stockDataset.length > 0) {
                    var bulk = stockDayQuoteCollection.initializeOrderedBulkOp({
                        useLegacyOps: true
                    });
                    for (var j = 0; j < stockDataset.length; j++) {
                        var stockdaydata = {};
                        stockdaydata.symbol = stocksymbol;
                        //TODO: fixed the date to be UTC
                        stockdaydata.date = new Date(stockDataset[j].Date);
                        stockdaydata.high = stockDataset[j].High;
                        stockdaydata.low = stockDataset[j].Low;
                        stockdaydata.open = stockDataset[j].Open;
                        stockdaydata.turnover = stockDataset[j].Turnover;
                        //batch.insert(data[i]);
                        bulk.find({
                            $and: [{symbol: stocksymbol}, {date: stockdaydata.date}]

                        }).upsert().replaceOne(
                            stockdaydata
                        );
                    }
                    var dsbulk = bulk.execute();
                    console.log(stocksymbol + ' bulk execute ds completed.');
                }
            }

        }).then((val)=> {
                callback(null, val);
            }
        ).catch(function (err, result) {
                console.log('err: ' + err + ', result: ' + result);
            });
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
            if (data != null) {
                data[i]["lastupdate"] = lastupdate;
                //batch.insert(data[i]);
                bulk.find({
                    symbol: data[i].symbol,
                }).upsert().replaceOne(
                    data[i]
                );
            }

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
            console.log('saveStockInfoMongo symbol:' + apiData.symbol);

            //sector transform
            if ((apiData.sector)) {
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

function getstockTodayQuoteList(symbol) {
    return function (callback) {
        request(util.format(stockTodayQuoteURL, parseInt(symbol)), function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var d = JSON.parse(body);
                d.symbol = symbol;
                d.date = new Date(d.Date);
                delete d.Date;
                console.log('getstockTodayQuoteList:' + d.symbol);
                callback(error, d);
            } else {
                callback(null, null);
            }
        });
    }
}

function saveStockTodayQuote(stockTodayQuote, db) {
    return function (callback) {
        if (stockTodayQuote != null) {
            var sdqCollection = db.collection('stockDayQuote');
            var stockTodayData = {};
            stockTodayData.symbol = stockTodayQuote.symbol;
            stockTodayData.date = new Date(Date.UTC(stockTodayQuote.date.getFullYear(), stockTodayQuote.date.getMonth(), stockTodayQuote.date.getDate(), 0, 0, 0));
            //stockTodayData.date = new Date(stockTodayQuote.date);
            stockTodayData.high = stockTodayQuote.High;
            stockTodayData.low = stockTodayQuote.Low;
            stockTodayData.open = stockTodayQuote.Open;
            stockTodayData.turnover = stockTodayQuote.Turnover;
            console.log("save Today Quote:" + stockTodayQuote.symbol);
            sdqCollection.updateOne(
                {$and: [{symbol: stockTodayData.symbol}, {date: stockTodayData.date}]}
                , stockTodayData
                , {upsert: true}
                , function (err, result) {
                    console.log("saved Today Quote:" + stockTodayQuote.symbol);
                    callback(err, result.ok);
                }
            )
        } else {
            callback(null, null);
        }
    }

}


MongoClient.connect(global.mongoURI, function (err, db) {
    co(function*() {

        var stocks = yield getStockList();
        //stocks = stocks.slice(0, 10);
        var saveStocks = yield saveStockListMongo(stocks, db);

        var getStockInfoMap = stocks.map(function (stock) {
            return getStockInfo(stock.symbol);
        });
        var stockInfos = yield parallel(getStockInfoMap, 20);
        var saveStockInfos = yield saveStockInfoMongo(stockInfos, db)


        var getStockDayHistQuoteMap = stocks.map(function (stock) {
            return getstockHistDayQuoteList(stock.symbol)

        })
        var stockDayHistQuote = yield parallel(getStockDayHistQuoteMap, 20);
        var saveStockDayQuotes = yield saveStockDayHistQuoteMongo(stockDayHistQuote, db);

        var getstockTodayQuoteListMap = stocks.map(function (stock) {
            return getstockTodayQuoteList(stock.symbol);
        });

        var stockTodayQuotes = yield parallel(getstockTodayQuoteListMap, 20);

        var saveStockTodayQuoteMap = stockTodayQuotes.map(
            function (stockTodayQuote) {
                return saveStockTodayQuote(stockTodayQuote, db)
            }
        )

        var saveStockTodayQuotes = yield parallel(saveStockTodayQuoteMap, 5);
        return saveStockTodayQuotes;

    }).then
    (function (val) {
        process.exit(1);

    })
        .catch(function (err, result) {
            console.log('err: ' + err + ', result: ' + result);
            process.exit(0);

        })


})
