require('dotenv').config();
const moongose = require('mongoose');
const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');

const app = express();

// MongoDB
moongose.connect(process.env.MONGOURL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error(err));

// Configure EJS
app.set('view engine', 'ejs');
app.use(expressEjsLayouts);

// Express Routing
app.use('/', require('./routes/index'));

app.listen(3000, () => {
	console.log('Server listening');
});