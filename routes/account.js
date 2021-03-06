const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../config/auth.js');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const Firefly = require('../firefly-api.js');

router.get('/link', isAuthenticated, (req, res) => {
	return res.render('account/link');
});
router.post('/link', isAuthenticated, async (req, res) => {
	const { code, school, schoolUrl, deviceId, authenticationResponse } = req.body;
	let errors = [];

	if (!code || !school || !schoolUrl || !deviceId || !authenticationResponse) errors.push('Please fill in all fields');
	if (school < 5 || school > 100) errors.push('The school name must be between 5 and 100 characters');
	if (schoolUrl < 5 || schoolUrl > 200) errors.push('The school url must be between 5 and 200 characters');
	if (deviceId < 5 || deviceId > 50) errors.push('The device id must be between 5 and 100 characters');

	if (errors.length > 0) return res.render('account/link', {
		errors: errors,
		code: code
	});

	//Check auth response
	let instance = null;
	try {
		instance = new Firefly(schoolUrl, 'Firefly Assistant');
		instance.setDeviceId(deviceId);
		instance.completeAuthentication(authenticationResponse);
		if (!await instance.verifyCredentials()) throw 'Invalid credentials';
	}
	catch (err) {
		return res.render('account/link', {
			errors: ['Invalid authentication response'],
			code: code
		});
	}

	//Add to db
	let user = req.user;
	user.name = instance.user.fullname,
	user.username = instance.user.username,
	user.fireflyEmail = instance.user.email;
	user.host = schoolUrl,
	user.school = school,
	user.calendarId = `${uuidv4()}-${uuidv4()}`;

	//Encrypt firefly export
	let iv = crypto.randomBytes(16);
	let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.SECRETKEY, 'hex'), iv);
	user.firefly = Buffer.concat([cipher.update(instance.export), cipher.final()]).toString('hex') + iv.toString('hex');

	user.save().then(err => {
		req.flash('successMessage','Successfully linked');
		res.redirect('/');
	}).catch(err => {
		return res.render('account/link', {
			errors: ['An error occured. Please try again'],
			code: code
		});
	})
});

router.get('/link/code', async (req, res) => {
	const { code } = req.query;
	if (!code) return res.json({ success: false, error: 'Code is required' });
	
	let school = await Firefly.getHost(code, 'Firefly Assistant');
	if (!school) return res.json({ success: false, error: 'School not found' });
	if (!school.enabled) return res.json({ success: false, error: 'This school is disabled' });

	return res.json({
		success: true,
		name: school.name,
		url: school.url,
		tokenUrl: school.tokenUrl,
		deviceId: school.deviceId
	});
});

module.exports = router;