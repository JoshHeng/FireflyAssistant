module.exports = {
	isAuthenticated: function (req, res, next) {
		if (req.isAuthenticated()) return next();
		req.flash('error', 'Please login to continue');
		res.redirect('/login');
	}
}