var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stockDaySchema = new Schema({
  Close: Number,
  Date: Date,
  High: Number,
  Low: Number,
  Open: Number,
  Turnover: Number,
  Volume: Number
});