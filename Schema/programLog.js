var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
    var programLogSchema = new Schema({
        '_id' :  {type: Schema.Types.ObjectId, default: function () { return new mongoose.Types.ObjectId} },
        'appName': String,
        'ipAddress': String,
        'enterDate': Date,
        'status': String,
        'remark': String,
        'beginDateTime': Date,
        'endDateTime': Date
    });
    
    programLogSchema.index({ 'appName': 1, 'enterDate': -1, 'status':1}); // schema level, ensure index
    mongoose.model('ProgramLog', programLogSchema, 'programLog');
};