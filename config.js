module.exports = {
	app_name: 'Projet Emendare',
	description: "La nouvelle plateforme collaborative et démocratique",
	keywords: "plateforme, démocratique, collaborative",
	author: "Jimmy LERAY",
	charset: 'utf-8',
	db_url: process.env.MONGODB_URI || 'mongodb://localhost:27017/db',
	port: process.env.PORT || 5000,
	logger_display: 'dev',
	view_engine: 'ejs',
	view_folder: 'views',
	static_folder: 'public',
	favicon_path: '/public/img/favicon.png',
	minify_options: {
		override: true,
		htmlMinifier:{
			removeComments: true,
			collapseWhitespace: true,
			collapseBooleanAttributes: true,
			processConditionalComments: true,
			removeAttributeQuotes: true,
			minifyJS: true,
			minifyCSS: true
		}
	},
	session_options: {
		secret: 'iceberg',
		resave: false,
		saveUninitialized: true,
		cookie: {secure: false}
	}
};