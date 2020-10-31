const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	createdAt: {
		type: Date,
		default: Date.now
	},

	name: {
		type: String
	},
	username: {
		type: String
	},
	fireflyEmail: {
		type: String
	},
	host: {
		type: String
	},
	school: {
		type: String
	},
	firefly: {
		type: String
	},

	calendarId: {
		type: String
	}
});

const User = mongoose.model('User', UserSchema);

module.exports = User;