var co = require('co');

module.exports =
{

    saveStockListMongo: function (mongoose, stockProfiles) {
        return function (callback) {

            var StockProfileMongo = mongoose.model('StockProfile');
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
            //MongoClient.connect(global.mongoURI, function(err, db) {
            var lastupdate = new Date();

            //var stockDayQuoteCollection = db.collection('stockDayQuote');
            var errmsg;
            //remove null object
            var data = _.filter(stockDayQuoteList, function (stockDayQuote) {
                return stockDayQuote != null;
            });

            var stockDayQuoteMongo = mongoose.model('StockDayQuote');
            var bulk = stockDayQuoteMongo.collection.initializeOrderedBulkOp({
                useLegacyOps: true
            });
            var bulkexecute = thunkify((callback) => {
                bulk.execute((err, docs)=> {
                    if (err) {
                        callback(err, docs.length);
                        console.info(err.message);
                    } else {
                        //console.info('%d potatoes were successfully stored.', docs.length);
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
                            var dateSetDate = new Date(stockDataset[j].Date);

                            stockdaydata.date = new Date(dateSetDate.getFullYear(), dateSetDate.getMonth(), dateSetDate.getDate(), 0, 0, 0);
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
                        }
                        console.log(stocksymbol + 'add bulk completed.');
                    }
                }

            }).then((val)=> {
                    co(function*() {
                        var bulkresult = yield bulkexecute();
                        console.log('bulkexecute completed.');
                        callback(null, val);
                    });
                }
            ).catch(function (err, result) {
                    console.log('err: ' + err + ', result: ' + result);
                });
        }
    }

}

