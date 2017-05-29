// Initialisation de Socket.io côté client
var socket = io();

// Echelle de couleur de la popularité
var couleurs = ['#c0392b', '#c23e2f', '#c44232', '#c54636', '#c74a39', '#c84e3d', '#ca5240', '#cb5643', '#cc5947', '#cd5d4a', '#cf604d', '#d06450', '#d16753', '#d26a56', '#d26d59', '#d3705c', '#d4735f', '#d47662', '#d57964', '#d57c67', '#d67f69', '#d6816c', '#d6846f', '#d78771', '#d78973', '#d78c76', '#d78e78', '#d7907a', '#d7937c', '#d6957e', '#d69780', '#d69982', '#d69b84', '#d59e86', '#d59f87', '#d4a189', '#d3a38b', '#d3a58c', '#d2a78e', '#d1a98f', '#d0aa90', '#cfac92', '#cead93', '#cdaf94', '#ccb095', '#cbb296', '#cab397', '#c8b498', '#c7b698', '#c6b799', '#c4b89a', '#c3b99a', '#c1ba9b', '#c0bb9b', '#bebc9b', '#bcbd9c', '#babe9c', '#b9be9c', '#b7bf9c', '#b5c09c', '#b3c09c', '#b1c19c', '#aec19b', '#acc29b', '#aac29b', '#a8c39a', '#a5c39a', '#a3c399', '#a1c398', '#9ec398', '#9bc497', '#99c496', '#96c395', '#93c394', '#91c393', '#8ec392', '#8bc390', '#88c28f', '#85c28e', '#82c28c', '#7ec18b', '#7bc189', '#78c087', '#74bf85', '#71bf84', '#6dbe82', '#69bd80', '#66bc7e', '#62bb7c', '#5eba7a', '#59b977', '#55b875', '#50b773', '#4cb670', '#47b56e', '#41b46b', '#3cb268', '#36b166', '#2faf63', '#27ae60'];

// Partie pour gérer l'affichage du nombre d'utilisateurs
socket.on('nb_users', (nb_users) => {
	if(nb_users <= 1){
		$('#nb_users').html(nb_users + ' <small>utilisateur en ligne</small>');
	}else{
		$('#nb_users').html(nb_users + ' <small>utilisateurs en ligne</small>');
	}
});

// Partie pour gérer le fonctionnement de l'historique du nombre d'utilisateurs
var users_history_flag = false;
var users_history_graph;
socket.on('users_history', (users_history) => {
	var graph_content = '';
	for (var i = 0; i < users_history.length; i++){
		graph_content = graph_content + ',' + users_history[i];
	}
	graph_content = graph_content.substring(1);
	$('#users_history').html(graph_content);
	if(users_history_flag){
		users_history_graph.change();
	}else{
		users_history_graph = $("#users_history").peity("line");
		users_history_flag = true;
	}
});

// Partie pour gérer le ping avec le serveur
var initial, final, ping;
setTimeout(function(){ initial = new Date(); socket.emit('tic') }, 500);
setInterval(function(){ initial = new Date(); socket.emit('tic') }, 5000);
socket.on('tac', () => {

	final = new Date();
	ping = final.getTime() - initial.getTime();

	// On fait un traitement pour afficher le ping à l'utilisateur
	if(ping<0){ping = 0;} // Parfois valeurs négatives en local ??
	if(ping>1000){
		$('#ping').html(Math.round(ping/100)/10 + ' <small>s</small>');
	}else{
		$('#ping').html(ping + ' <small>ms</small>');
	}
	
	// Et une couleur indiquant la qualité de la connexion
	if(ping < 100){
		$('#signal').css("color", "#21BA45"); // green
	}else if(ping < 200){
		$('#signal').css("color", "#B5CC18"); // olive
	}else if(ping < 400){
		$('#signal').css("color", "#FBBD08"); // yellow
	}else if(ping < 800){
		$('#signal').css("color", "#F2711C"); // orange
	}else{
		$('#signal').css("color", "#DB2828"); // red
	}
});

// Convertir une couleur Hex sur fond blanc en RGB
function convertHexToRGB(hex, opacity){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    var alpha = 1 - opacity;
	r = Math.round((opacity * (r / 255) + alpha) * 255);
	g = Math.round((opacity * (g / 255) + alpha) * 255);
	b = Math.round((opacity * (b / 255) + alpha) * 255);
    return 'rgb('+r+','+g+','+b+')';
}

// Fonction pour remplacer rapidement le html d'un élement
function replaceHtml(el, html) {
	var oldEl = typeof el === "string" ? document.getElementById(el) : el;
	/*@cc_on // Pure innerHTML is slightly faster in IE
		oldEl.innerHTML = html;
		return oldEl;
	@*/
	var newEl = oldEl.cloneNode(false);
	newEl.innerHTML = html;
	oldEl.parentNode.replaceChild(newEl, oldEl);
	/* Since we just removed the old element from the DOM, return a reference
	to the new element, which can be used to restore variable references. */
	return newEl;
};

// Si un utilisateur demande un texte
function get_texte(id){ $('#id_texte').html(id); socket.emit('get_texte', id); }
socket.on('get_texte', (texte) => {
	console.timeEnd("send_vote");
	console.time("get_texte");
	var contenu = [], popularite = 50.0;
	var popularite_moyenne = 0;
	var votes_moyenne = 0;
	var user_id = $('#user_id').html();

	for(var i = 0; i < texte.contenu.length; i++){

		if(typeof user_id != "undefined"){
			// L'utilisateur a t'il deja voté pour ce caractère ?
			if(texte.contenu[i].votes_pour.indexOf(user_id) !== -1){
				texte.contenu[i].pour = true;
			}else{
				texte.contenu[i].pour = false;
			}

			// L'utilisateur a t'il deja voté contre ce caractère ?
			if(texte.contenu[i].votes_contre.indexOf(user_id) !== -1){
				texte.contenu[i].contre = true;
			}else{
				texte.contenu[i].contre = false;
			}
		}else{
			texte.contenu[i].pour = false; texte.contenu[i].contre = false;
		}

		var nombre_votants = texte.contenu[i].votes_pour.length + texte.contenu[i].votes_contre.length;
		var popularite = Math.round(1000*texte.contenu[i].votes_pour.length/(nombre_votants))/10;
		if(isNaN(popularite)){ popularite = 50.0; }
		var pop_color = Math.floor(popularite);
		if(pop_color == 100){ pop_color = 99; }
		if(texte.contenu[i].contenu == '§'){
			contenu.push('<br>');
		}else{
			contenu.push('<i data-index='+ i +' class="t ');
			if(texte.contenu[i].pour){
				contenu.push('p');
			}else if(texte.contenu[i].contre){
				contenu.push('c');
			}else{
				contenu.push('n');
			}
			contenu.push('" style="background:' + convertHexToRGB(couleurs[pop_color],0.15) + '">' + texte.contenu[i].contenu + '</i>');
		}
		popularite_moyenne = popularite_moyenne + popularite;
		votes_moyenne = votes_moyenne + nombre_votants;
	}
	popularite_moyenne = Math.round(10*popularite_moyenne/texte.contenu.length)/10;
	votes_moyenne = Math.round(10*votes_moyenne/texte.contenu.length)/10;
	var pop_moyenne_color = Math.floor(popularite_moyenne);
	if(pop_moyenne_color == 100){pop_moyenne_color = 99;}
	$('.gradients').removeClass("select");
	$('#gradient-' + pop_moyenne_color).addClass("select");
	replaceHtml('content', contenu.join(''));
	$('#content').css("background-color",convertHexToRGB(couleurs[pop_moyenne_color],0.15));
	$('#popularite-moyenne').html(popularite_moyenne);
	$('#votes-moyenne').html(votes_moyenne);
	console.timeEnd("get_texte");
});

// L'utilisateur envoit un vote au serveur
function send_vote(t,texte,debut,fin){
	var user_id = $('#user_id').html();
	if(typeof user_id != "undefined"){
		if(typeof debut != "undefined" && typeof fin != "undefined"){
			if(Number(debut) > Number(fin)){var temp = fin; fin = debut; debut = temp;}
			d = {user_id: user_id, id_texte: texte, debut: debut, fin: fin};
			if(t == "pour"){ d.t = "pour" }else if(t == "neutre"){ d.t = "neutre" }else if(t == "contre"){d.t = "contre" }
			socket.emit('send_vote', d);
		}
	}
	console.time("send_vote");
}