var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
    var stockProfileSchema = new Schema({
        "_id" : Schema.Types.ObjectId,
        "symbol" : String,
        "sc" : String,
        "en" : String,
        "lastupdate" : Date
    });
    var stockProfileInfoSchema = new Schema({
        "_id" : Schema.Types.ObjectId,
        "symbol" : String,
        "sc" : String,
        "en" : String,
        "lastupdate" : Date
    });
    mongoose.model('StockProfile', stockProfileSchema, 'stockProfile');
};