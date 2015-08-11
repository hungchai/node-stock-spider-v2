global.config = require('../sensitive_data/config.json');
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var Client = require('node-rest-client').Client;
var co = require('co');
var parallel = require('co-parallel');
var util = require('util');
var buf = require("buffer");
var request = require('request');

var client = new Client();
global.mongoLabURI = global.config.mongoDbConn.mongoLabURI;

//mongoose.connect(config[config.mongoDbConn[0]].URI);

//step 1
var stockListURL = 'https://api.investtab.com/api/search?limit=3000&query=hk&chart_only=false&type=stock';
var stockMinQuoteURL = 'http://hkej.m-finance.com/charting/tomcat/mfchart?code=%s&period=1min&frame=72+HOUR';
var stockInfoURL = 'https://api.investtab.com/api/quote/%s/info';
// registering remote methods

function getStockList() {
    return function(callback) {
        request(stockListURL, function(error, response, body) {
            callback(error, JSON.parse(body));
        });

    };
};
//e.g: stockSymbol = 00700.HK
function getStockInfo(stockSymbol) {
    return function(callback) {
        request(util.format(stockInfoURL, stockSymbol), function(error, response, body) {
            callback(error, JSON.parse(body));
        });

    };
};
//e.g: stockNum = 700
function stockMinQuoteList(stockNum) {
    return function(callback) {
        request(util.format(stockMinQuoteURL, parseInt(stockNum)), function(error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(error, JSON.parse(body));
            }
        })

    };
};

function saveStockListMongo(stocks) {
    return function(callback) {
        var data = stocks;
        MongoClient.connect(global.mongoLabURI, function(err, db) {
            if (!err) {
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
                bulk.execute(function(err, result) {
                    console.log(result.nInserted);
                    callback(err, result);
                });


            }
            else {
                callback(err, null);
            }
        })
    }
};

function saveStockInfoMongo(stockInfos) {
    return function(callback) {
        var data = stockInfos;
        MongoClient.connect(global.mongoLabURI, function(err, db) {
            if (!err) {
                var lastupdate = new Date();
                var stockProfile2Collection = db.collection('stockProfile');
                var bulk = stockProfile2Collection.initializeUnorderedBulkOp({
                    useLegacyOps: true
                });
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i]["lastupdate"] = lastupdate;
                    //batch.insert(data[i]);
                    bulk.find({
                        symbol: data[i].symbol

                    }).update({
                        $set: {
                            info: data[i]
                        }
                    });
                }
                bulk.execute(function(err, result) {
                    console.log(result.nInserted);
                    callback(err, result);
                });


            }
            else {
                callback(err, null);
            }
        })
    }
};
co(function*() {
    var stocks = (yield getStockList());
    var saveStocks= yield saveStockListMongo(stocks);
    
    var getStockInfoMap = stocks.map(function(stock) {
        return getStockInfo(stock.symbol);
    })
    var stockInfos = yield parallel(getStockInfoMap, 2);
    var saveStockInfos = yield saveStockInfoMongo(stockInfos)
    //

    var p2 = stocks.map(function(stockObj) {
        return stockMinQuoteList(parseInt(stockObj.symbol));
    });
    //var res = yield parallel(p2, 4);
    //console.log(JSON.stringify(res))


}).catch(function(err, result) {
    console.log('err: ' + err + ', result: ' + result);
});
