const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

module.exports = function(passport) {
	passport.use(
		new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
			User.findOne({ email: email }).then(user => {
				if (!user) return done(null, false, { message: 'Invalid credentials' });

				bcrypt.compare(password, user.password, (err, isMatch) => {
					if (err) throw err;

					if (isMatch) return done(null, user);
					return done(null, false, { message: 'Invalid credentials' })
				});
			}).catch(err => {
				throw err;
			})
		})
	)

	passport.serializeUser((user, done) => done(null, user.id));
	passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));
}