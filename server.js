// Initialisation de l'application
var express = require('express');
var app = express();

// Initialisation de Socket.io
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Chargement de la configuration
var config = require('./config');

// Chargement des modules externes
var path = require('path');
var chalk = require('chalk'); 
var logger = require('morgan');  
var cookieParser = require('cookie-parser');  
var bodyParser = require('body-parser');

// Gestion de la base de données
var mongoose = require('mongoose'); 
mongoose.connect(config.db_url);
mongoose.connection.on("error", () => { console.log(chalk.red("Erreur de connexion à MongoDB")) });
mongoose.connection.on("open", () => { console.log(chalk.green("Connexion réussie à MongoDB")) });

// Gestion de l'authentification avec Passport
var passport = require('passport');  
var LocalStrategy = require('passport-local').Strategy; 
var flash = require('connect-flash');  
var session = require('express-session');

// Minification des ressources html
var minify = require('express-minify-html');
app.use(minify(config.minify_options));

// Compression GZip des ressources
var compress = require('compression');
app.use(compress());

// Affichage d'une icone d'en-tête
var favicon = require('serve-favicon');
app.use(favicon(__dirname + config.favicon_path));

// Gestion des fichiers statiques
app.use(express.static(path.join(__dirname, config.static_folder)));

// Moteur de template pour les rendus
app.set('view engine', config.view_engine);
app.set('views', path.join(__dirname, config.view_folder));

// Affichage de logs dans la console
app.use(logger(config.logger_display));  

// Gestion des parsers des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Initialisation des sessions, de flash
app.use(session(config.session_options));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Initialisation de Passport
require('./passport')(passport);

// Router (Gestion des routes du site)
var router = require('./router');
app.use(require('./router'));

// Mise en route de Socket.io côté serveur
require('./socket')(io);

// Ecoute le port configuré
http.listen(config.port);