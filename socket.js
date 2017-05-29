// Intégration du module async
var async = require('async');

// Chargement des modèles
var User = require('./models/user');
var Text = require('./models/text');
var Char = require('./models/char');

// Ensemble des règles de Socket.io côté serveur
module.exports = (io) => {

	// Initialisation de variables
	var nb_users = 0;
	var users_history = [];

	// Partie pour afficher l'historique d'utilisation côté client
	var update_users_history = () => {
		if(users_history.length < 60){
			users_history.push(nb_users);
		}else{
			users_history.splice(0,1);
			users_history.push(nb_users);
		}
		io.emit('users_history', users_history);
	}

	// On envoit les données concernant le nombre d'utilisateurs régulièrement
	setInterval(() => {
		update_users_history();
		io.emit('nb_users', nb_users);
	}, 1000);

	// Si un utilisateur se connecte
	io.on('connection', (socket) => {
		nb_users++; // On met à jour le nombre d'utilisateurs connectés

		// Partie pour gérer l'affichage du ping côté client
		socket.on('tic', () => { socket.emit('tac') });

		// Si un utilisateur demande un texte
		socket.on('get_texte', (id) => {
			Text.findById(id).populate({path: 'contenu', model: 'Char'}).exec((err,texte) => {
				if(err){ throw err; }
				socket.emit('get_texte', texte);
			});
		});

		// Si un utilisateur effectue un vote
		socket.on('send_vote', (data) => {
			console.time("send_vote");
			Text.findById(data.id_texte).populate({path: 'contenu', model: 'Char'}).exec((err, texte) => {
				if(err){ throw err; }

				var arr = [];
				for(var i = Number(data.debut); i <= Number(data.fin); i++){ arr[i] = i; }

				async.each(arr, (item, callback) => {
					if(typeof item != "undefined"){
						Char.findById(texte.contenu[item]._id).exec((err, char) => {
							if(err){ throw err; }
							if(data.t == "pour"){
								if(char.votes_pour.indexOf(data.user_id) == -1){
									char.votes_pour.push(data.user_id);
								}
								if(char.votes_contre.indexOf(data.user_id) != -1){
									char.votes_contre.splice(char.votes_contre.indexOf(data.user_id), 1);
								}
							}else if(data.t == "contre"){
								if(char.votes_contre.indexOf(data.user_id) == -1){
									char.votes_contre.push(data.user_id);
								}
								if(char.votes_pour.indexOf(data.user_id) != -1){
									char.votes_pour.splice(char.votes_pour.indexOf(data.user_id), 1);
								}
							}else if(data.t == "neutre"){
								if(char.votes_pour.indexOf(data.user_id) != -1){
									char.votes_pour.splice(char.votes_pour.indexOf(data.user_id), 1);
								}
								if(char.votes_contre.indexOf(data.user_id) != -1){
									char.votes_contre.splice(char.votes_contre.indexOf(data.user_id), 1);
								}
							}
							char.save((err) => {
								if(err){ throw err; }
								callback(false);
							});
						});
					}else{
						callback(false);
					}
				}, (err) => {
					if(err){ throw err; }
					Text.findById(data.id_texte).populate({path: 'contenu', model: 'Char'}).exec((err, texte) => {
						io.emit('get_texte', texte);
						console.timeEnd("send_vote");
					});
				});
			});
		});

		// Si un utilisateur se déconnecte
		socket.once('disconnect', () => { nb_users-- });
	});
}