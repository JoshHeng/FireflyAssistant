require('dotenv').config();
const moongose = require('mongoose');
const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');

const app = express();
require('./config/passport')(passport);

// MongoDB
moongose.connect(process.env.MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error(err));

// Configure EJS
app.set('view engine', 'ejs');
app.use(expressEjsLayouts);
app.use(express.urlencoded({extended : false}));
app.use(session({
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
	res.locals.successMessage = req.flash('successMessage');
	res.locals.error = req.flash('error');
	next();
});

// Express Routing
app.use('/', require('./routes/index'));
app.use('/account', require('./routes/account'));

app.listen(3000, () => {
	console.log('Server listening');
});