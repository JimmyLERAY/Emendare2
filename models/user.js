var mongoose = require('mongoose');  
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	admin: Boolean,
	pseudo: String,
	email: String,
	password: String,
	portable: String,
	points: {type: Number, default: 0}
});

userSchema.methods.generateHash = function(password){
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password){
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);