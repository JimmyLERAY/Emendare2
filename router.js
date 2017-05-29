var express = require('express');
var passport = require('passport'); 
var router = express.Router();

// Chargement de la configuration
var config = require('./config');

// Chargement des modèles
var User = require('./models/user');
var Text = require('./models/text');
var Char = require('./models/char');

// Liste des routes disponibles
var routes = require('./routes');

router.post('/inscription', passport.authenticate('inscription',{  
	successRedirect: '/redaction',
	failureRedirect: '/inscription',
	failureFlash: true
}));

router.post('/connexion', passport.authenticate('connexion',{  
	successRedirect: '/redaction',
	failureRedirect: '/connexion',
	failureFlash: true
}));

router.get('/deconnexion', (req, res) => {
	req.logout();
	res.redirect('/redaction');
});

router.get('/user_delete', (req, res) => {
	isLoggedIn(req, res, () => {
		User.findOne({'email': req.user.email}, (err, user) => {
	      if(err){ throw err; }
	      if(user.password === req.user.password){
	      	// Si l'utilisateur est bien identifié on supprime son compte
	      	User.findByIdAndRemove(req.user._id, (err, user) => {
	      		// On supprime toutes ses participations aux textes
	      		Text.find().exec((err,textes) => {
					if(err){ throw err; }
					for(var i=0; i < textes.length; i++){
						for(var j=0; j < textes[i].users.length; j++){
							console.log(textes[i].users[j].toString(), req.user._id.toString());
							if(textes[i].users[j].toString() == req.user._id.toString()){
								textes[i].users.splice(j, 1);
								textes[i].save();
							}
						}
					}
					// Puis on le redirige vers l'acceuil
					req.logout();
					res.redirect('/');
				});
	      	});
	      }else{
	      	// Si il n'est pas identifié on le redirige vers l'acceuil
	      	req.logout();
			res.redirect('/');
	      }
	    });
	})
	
});

router.post('/creer_texte', (req, res) => {
	isLoggedIn(req, res, () => {
		var contenu = req.body.contenu.split("\r\n").join("§");		
		if(req.body.locked){ var locked = true }else{ var locked = true }
		Text.create({
			titre: req.body.titre,
			description: req.body.description,
			locked: locked
		},(err, texte) => {
			if(err){ throw err; }
			for (var i = 0; i < contenu.length; i++){
				var char = new Char();
				char.contenu = contenu[i];
				char.id_texte = texte._id;
				char.id_auteur = req.body.auteur;
				char.save();
				texte.contenu.push(char._id)
			}
			texte.save();
			res.redirect('/redaction');
		});
	})
});

router.get('/nouveau_participant', (req, res) => {
	isLoggedIn(req, res, () => {
		User.findById(req.query.user,function(err,user){
			if(err){ res.redirect('/texte?id='+req.query.text); }
			Text.findById(req.query.text,function(err,texte){
				if(err){ throw err; }
				texte.users.push(req.query.user.toString());
				texte.save();
				res.redirect('/texte?id='+req.query.text);
			});
		});
	})
	
});

router.get('/ne_participe_plus', (req, res) => {
	isLoggedIn(req, res, () => {
		User.findById(req.query.user,function(err,user){
			if(err){ res.redirect('/texte?id='+req.query.text); }
			Text.findById(req.query.text,function(err,texte){
				if(err){ throw err; }
				for(var i=0; i < texte.users.length; i++){
					if(texte.users[i].toString() == req.query.user.toString()){
						texte.users.splice(i, 1);
					}
				}
				texte.save();
				res.redirect('/textes');
			});
		});
	});
	
});


// Si la page est référencée dans les routes, on l'envoit
for(var i=0; i < routes.length; i++){

	if(routes[i].isLogged){
		// Si l'utilisateur doit être connecté
		router.get(routes[i].path, (req, res, next) => {

			// On passe des données utiles
			res.locals.req = req;
			res.locals.config = config;
			res.locals.routes = routes;
			res.locals.messages = {
				erreur: req.flash('ErrorMessage')[0]
			};

			User.find().exec(function(err, users){
				if(err){throw err;}
				res.locals.users = users;

				Text.find().sort({users: -1, contenu: -1}).exec(function(err, textes){
					if(err){throw err;}
					res.locals.textes = textes;
					isLoggedIn(req, res, () => { res.render('index'); })
				});
			});
		});
	}else{
		// Sinon l'utilisateur n'a pas besoin d'être connecté
		router.get(routes[i].path, (req, res, next) => {

			// On passe des données utiles
			res.locals.req = req;
			res.locals.config = config;
			res.locals.routes = routes;
			res.locals.messages = {
				erreur: req.flash('ErrorMessage')[0]
			};

			User.find().exec(function(err, users){
				if(err){throw err;}
				res.locals.users = users;

				Text.find().sort({users: -1, contenu: -1}).exec(function(err, textes){
					if(err){throw err;}
					res.locals.textes = textes;
					res.render('index');
				});
			});
		});
	}
}

// Sinon la page n'est pas référencée normalement et on renvoit une erreur
router.get('/*', (req, res, next) => {

	// On passe des données utiles
	res.locals.req = req;
	res.locals.config = config;
	res.locals.routes = routes;

	res.locals.erreur = {
		titre: 'Cette page est introuvable',
		sous_titre: 'Soit elle n\'existe plus, soit vous vous êtes perdu',
		bouton: 'Retourner à l\'acceuil'
  	};
  	res.status(404);
	res.render('erreur');

});

// Fonction pour vérifier si l'utilisateur est connecté
function isLoggedIn(req, res, callback){
	// Si l'utilisateur est connecté on continue
	if(req.isAuthenticated()){return callback();}
	// Sinon renvoit à la page de connexion
	res.redirect('/connexion');
}

module.exports = router;