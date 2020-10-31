const express = require('express');
const router = express.Router();

const emailValidator = require('email-validator');
const bcrypt = require('bcrypt');
const User = require('../models/user.js');
const { isAuthenticated } = require('../config/auth.js');
const passport = require('passport');

router.get('/', (req, res) => {
	if (req.isAuthenticated()) {
		return res.render('dashboard', { 
			user: req.user
		});
	}
	return res.render('index');
});

// Authentication
router.get('/login', (req, res) => {
	res.render('login');
});
router.get('/register', (req, res) => {
	res.render('register');
});
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('successMessage', 'Logged out');
	res.redirect('/login');
})

router.post('/login', (req, res, next) => {
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true
	}) (req, res, next);
});
router.post('/register', (req, res) => {
	const { email, password, passwordConfirm } = req.body;

	let errors = [];
	if (!email || !password || !passwordConfirm) errors.push('Please fill in all fields');
	if (password !== passwordConfirm) errors.push('Passwords do not match');
	if (password.length < 6 || password.length > 30) errors.push('Passwords must be between 6 and 30 characters');
	if (email.length > 100) errors.push('Email must be less than 100 characters');
	if (!emailValidator.validate(email)) errors.push('Invalid email');

	if (errors.length > 0) return res.render('register', {
		errors: errors,
		email: email,
		password: password,
		passwordConfirm: passwordConfirm
	});

	User.findOne({ email: email }).exec((err, user) => {
		if (user) {
			errors.push('Email already registered. Please email support@joshheng.co.uk if you need to reset your password');

			return res.render('register', {
				errors: errors,
				email: email,
				password: password,
				passwordConfirm: passwordConfirm
			});
		}

		// Hash password
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(password, salt, (err, hash) => {
				if (err) {
					console.error(err);
					return res.render('register', {
						errors: ['An error occured. Please try again later'],
						email: email,
						password: password,
						passwordConfirm: passwordConfirm
					});
				}

				const newUser = new User({
					email: email,
					password: hash
				});
				newUser.save().then(() => {
					req.flash('successMessage','Registration successful!');
					res.redirect('/login');
				}).catch(err => {
					console.error(err);
					return res.render('register', {
						errors: ['An error occured. Please try again later'],
						email: email,
						password: password,
						passwordConfirm: passwordConfirm
					});
				});
			});
		});
	});
});
router.post('/delete', isAuthenticated, (req, res) => {
	User.deleteOne({ _id: req.user._id }).then((err) => {
		req.flash('successMessage','Account deleted!');
		req.logout();
		return res.redirect('/');
	});
});


module.exports = router;