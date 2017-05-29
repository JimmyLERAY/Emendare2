var LocalStrategy = require('passport-local').Strategy;  
var User = require('./models/user');

module.exports = function(passport){  
  passport.serializeUser(function(user, done){
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
      done(err, user);
    });
  });

  passport.use('inscription', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  function(req, email, password, done){
    process.nextTick(function(){
      User.findOne({'email': email}, function(err, user){
        if(err){ return done(err); }
        if(user){
          return done(null, false, req.flash('ErrorMessage', 'Cet email est déjà utilisé'));
        }else{
          var newUser = new User();
          newUser.admin = false;
          newUser.pseudo = req.body.pseudo;
          newUser.portable = req.body.portable;
          newUser.email = email;
          newUser.password = newUser.generateHash(password);
          newUser.save(function(err){
            if(err){ throw err; }
            return done(null, newUser);
          });
        }
      });
    });
  }));

  passport.use('connexion', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  function(req, email, password, done){
    User.findOne({'email': email}, function(err, user){
      if(err){ return done(err); }
      if(!user){ return done(null, false, req.flash('ErrorMessage', 'Utilisateur introuvable')); }   
      if(!user.validPassword(password)){ return done(null, false, req.flash('ErrorMessage', 'Mot de passe incorrect')); }
      return done(null, user);
    });
  }));
};