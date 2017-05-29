var mongoose = require('mongoose');

var charSchema = mongoose.Schema({
	created: {type: Date,default: Date.now},
	contenu: {type: String, default: ""},
	id_texte: {type: mongoose.Schema.Types.ObjectId, ref: 'Text'},
	id_auteur: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	votes_pour: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], unique: true},
	votes_contre: {type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], unique: true}
});

module.exports = mongoose.model('Char', charSchema);