var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stockDayQuoteSchema = new Schema({
    'symbol': String,
    'date': Date,
    'high': Number,
    'low': Number,
    'open': Number,
    'close': Number,
    'turnover': Number

});

module.exports = stockDayQuoteSchema;