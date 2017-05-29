var mongoose = require('mongoose');

var textSchema = mongoose.Schema({
	created: {type: Date,default: Date.now},
	titre: {type: String, default: ""},
	description: {type: String, default: ""},
	contenu: {type: [mongoose.Schema.Types.ObjectId], ref: 'Char', unique: true},
	locked: {type: Boolean, default: true}
});

module.exports = mongoose.model('Text', textSchema);