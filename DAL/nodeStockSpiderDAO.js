var co = require('co');
var _ = require("underscore");
var moment = require("moment-timezone");
module.exports =
{

    saveStockListMongo: function (mongoose, stockProfiles) {
        return function (callback) {
            var StockProfileMongo = mongoose.model('StockProfile');
            //var db = mongoose.connection;
            //var bulk = db.collection('StockProfile').initializeUnorderedBulkOp({
            //    useLegacyOps: true
            //});
            var bulk = StockProfileMongo.collection.initializeUnorderedBulkOp({
                useLegacyOps: true
            });
            for (var i = 0, len = stockProfiles.length; i < len; i++) {
                if (stockProfiles[i].symbol != null) {
                    //batch.insert(data[i]);
                    bulk.find({
                        symbol: stockProfiles[i].symbol,
                    }).upsert().updateOne(
                        stockProfiles[i]
                    );
                }

            }
            bulk.execute(onBulk);

            function onBulk(err, docs) {
                if (err) {
                    callback(err, docs.length);
                } else {
                    console.info('%d potatoes were successfully stored.', docs.length);
                    callback(null, docs.length);
                }
            }
        }


    },

    saveStockDayHistQuoteMongo: function (mongoose, stockDayQuoteList) {
        return function (callback) {
            var rowdata = stockDayQuoteList;

            var lastupdate = new Date();
            var errmsg;

            //remove null object
            var data = _.filter(stockDayQuoteList, function (stockDayQuote) {
                return stockDayQuote != null;
            });

            var stockDayQuoteModel = mongoose.model('StockDayQuote');
            var bulk = stockDayQuoteModel.collection.initializeOrderedBulkOp({
                useLegacyOps: true
            });
            var bulkexecute = thunkify((callback) => {
                bulk.execute((err, docs)=> {
                    if (err) {
                        callback(err, docs.length);
                        console.info(err.message);
                    } else {
                        callback(null, docs.length);
                    }
                })
            });
            co(function*() {
                for (var i = 0, len = data.length; i < len; i++) {
                    var stocksymbol = data[i].symbol;
                    var stockDataset = data[i].dataset;
                    console.log('start handle dataset of symbol:' + data[i].symbol);

                    if (stockDataset != null && stockDataset.length > 0) {

                        for (var j = 0; j < stockDataset.length; j++) {
                            var stockdaydata = {};
                            stockdaydata.symbol = stocksymbol;
                            //TODO: fixed the date to be UTC
                            //var dateSetDate = new Date(stockDataset[j].Date);

                            //stockdaydata.date = new Date(dateSetDate.getFullYear(), dateSetDate.getMonth(), dateSetDate.getDate(), 0, 0, 0);
                            stockdaydata.date = moment.tz(stockDataset[j].Date, "Asia/Hong_Kong").toDate();
                            stockdaydata.high = parseFloat(stockDataset[j].High);
                            stockdaydata.low = parseFloat(stockDataset[j].Low);
                            stockdaydata.open = parseFloat(stockDataset[j].Open);
                            stockdaydata.close = parseFloat(stockDataset[j].Close);
                            stockdaydata.turnover = parseFloat(stockDataset[j].Turnover);
                            stockdaydata.volume = parseFloat(stockDataset[j].Volume);
                            //batch.insert(data[i]);
                            bulk.find({
                                $and: [{symbol: stocksymbol}, {date: stockdaydata.date}]

                            }).upsert().updateOne(
                                stockdaydata
                            );
                            hksymdate = null;
                        }
                        console.log(stocksymbol + ' add bulk completed.');
                    }
                    if (i % 2000 == 0 || i === len - 1) {
                        console.log('bulkexecuting ....');
                        var bulkresult = yield bulkexecute();
                        console.log('bulkexecute completed.');
                    }
                }

            }).then((val)=> {
                    co(function*() {

                        callback(null, val);
                    });
                }
            ).catch(function (err, result) {
                    console.log('err: ' + err + ', result: ' + result);
                });
        }
    },

    saveStockTodayQuote: function (mongoose, stockTodayQuote) {
        return function (callback) {
            if (stockTodayQuote != null) {
                var stockDayQuoteModel = mongoose.model('StockDayQuote');
                var stockTodayData = {};
                stockTodayData.symbol = stockTodayQuote.symbol;
                //cut timestamp
                stockTodayData.date = moment.tz(stockTodayQuote.date.substr(0, 10), "Asia/Hong_Kong").toDate();
                //stockTodayData.date = new Date(stockTodayQuote.date);
                stockTodayData.high = parseFloat(stockTodayQuote.High);
                stockTodayData.low = parseFloat(stockTodayQuote.Low);
                stockTodayData.open = parseFloat(stockTodayQuote.Open);
                stockTodayData.close = parseFloat(stockTodayQuote.Close);
                stockTodayData.turnover = parseFloat(stockTodayQuote.Turnover);
                stockTodayData.volume = parseFloat(stockTodayQuote.Volume);
                console.log("save Today Quote:" + stockTodayQuote.symbol);

                // var stockDayQuoteModel = new stockDayQuoteMongo(stockTodayData);

                stockDayQuoteModel.collection.update(
                    {$and: [{symbol: stockTodayData.symbol}, {date: stockTodayData.date}]}
                    , stockTodayData
                    , {upsert: true}
                    , function (err, result) {
                        console.log("saved Today Quote:" + stockTodayQuote.symbol);
                        callback(err, result.ok);
                    }
                )
                hksymdate = null;
            } else {
                callback(null, null);
            }
    }

    }
}

