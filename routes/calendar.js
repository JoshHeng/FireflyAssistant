const express = require('express');
const router = express.Router();
const ical = require('ical-generator');
const Firefly = require('../firefly-api.js');
const UserModel = require('../models/user.js');
const crypto = require('crypto');

function formatEvents(rawEvents) {
	//Format events, merge doubles and remove unwanted events
	const blacklist = ['Senior Registration'];
	const forceMerge = ['Games'];
	const formattedEvents = [];

	let endedTimestamp = null;
	let currentForcedMerge = null;

	rawEvents.forEach(event => {
		// Blacklist
		if (blacklist.includes(event.subject) || blacklist.includes(event.description)) return;

		// Forced merges
		if (forceMerge.includes(event.subject) && ((!currentForcedMerge) || currentForcedMerge.subject == event.subject)) {
			if (currentForcedMerge) {
				let end = new Date(event.end);
				if (end.getTime() > currentForcedMerge.end) currentForcedMerge.end = end;
				if (!currentForcedMerge.locations.includes(event.location)) currentForcedMerge.locations.push(event.location);
				if (!currentForcedMerge.descriptions.includes(event.description)) currentForcedMerge.descriptions.push(event.description);
				if (!currentForcedMerge.teachers.includes(event.attendees[0].principal.name)) currentForcedMerge.teachers.push(event.attendees[0].principal.name);
				if (!currentForcedMerge.classes.includes(event.attendees[1].principal.name)) currentForcedMerge.classes.push(event.attendees[1].principal.name);
			}
			else {
				currentForcedMerge = {
					uid: event.guid,
					start: new Date(event.start),
					end: new Date(event.end),
					subject: event.subject,
					locations: [event.location],
					descriptions: [event.description],
					teachers: [event.attendees[0].principal.name],
					classes: [event.attendees[1].principal.name]
				}
			}

			return;
		}
		else if (currentForcedMerge) {
			let location = currentForcedMerge.locations.join(', ');
			let description = currentForcedMerge.descriptions.join(', ');
			let teacher = currentForcedMerge.teachers.join(', ');
			let classes = currentForcedMerge.classes.join(', ');

			formattedEvents.push({
				uid: currentForcedMerge.uid, 
				start: currentForcedMerge.start.toISOString().slice(0, -5)+'Z',
				end: currentForcedMerge.end.toISOString().slice(0, -5)+'Z',
				location: location,
	
				summary: `${currentForcedMerge.subject} - ${teacher}, ${description}`,
				description: `${currentForcedMerge.subject}\nTeacher: ${teacher}\nDescription: ${description}\nClass: ${classes}\nRoom: ${location}`,
				htmlDescription: `<h1>${currentForcedMerge.subject}</h1><br><ul><li><strong>Teacher:</strong> ${teacher}</li><li><strong>Description:</strong> ${description}</li><li><strong>Class:</strong> ${classes}</li><li><strong>Room:</strong> ${location}</li></ul>`,
			});
			currentForcedMerge = null;
		}

		let description = `${event.subject}\nTeacher: ${event.attendees[0].principal.name}\nDescription: ${event.description}\nClass: ${event.attendees[1].principal.name}\nRoom: ${event.location}`;

		// Merging of doubles
		if (event.start === endedTimestamp) {
			let lastEvent = formattedEvents[formattedEvents.length - 1];
			if (description === lastEvent.description) {
				lastEvent.end = event.end;
				endedTimestamp = event.end;
				return;
			}
		}

		// Basic event adding
		formattedEvents.push({
			uid: event.guid, 
			start: event.start,
			end: event.end,
			location: event.location,

			summary: `${event.subject} - ${event.attendees[0].principal.name}, ${event.description}`,
			description: description,
			htmlDescription: `<h1>${event.subject}</h1><br><ul><li><strong>Teacher:</strong> ${event.attendees[0].principal.name}</li><li><strong>Description:</strong> ${event.description}</li><li><strong>Class:</strong> ${event.attendees[1].principal.name}</li><li><strong>Room:</strong> ${event.location}</li></ul>`,
		});
		endedTimestamp = event.end;
	});

	return formattedEvents;
}


async function generateCalendar(user) {
	const instance = new Firefly(user.host);

	//Decrypt firefly export
	try {
		let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.SECRETKEY, 'hex'), Buffer.from(user.firefly.slice(-32), 'hex'));
		let encrypted = Buffer.from(user.firefly.slice(0, -32), 'hex');
		let plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
		instance.import(plain);
	}
	catch (err) { console.error(err); throw 'Invalid Firefly account. Please authenticate!'; }
	

	let startDate = new Date();
	startDate.setDate(startDate.getDate() - 14);
	let endDate = new Date();
	endDate.setMonth(endDate.getMonth() + 2);

	let events = [];
	try {
		events = await instance.getEvents(startDate, endDate);
	}
	catch (err) {
		throw 'Invalid Firefly account. Please authenticate!';
	}

	const calendar = ical({
		domain: process.env.DOMAIN,
		name: `${user.name}'s Firefly Timetable`,
		url: process.env.DOMAIN + `/calendar/ical/${user.calendarId}`,
		ttl: 86400, //24 hours
		events: formatEvents(events)
	});

	return calendar.toString();
}

router.get('/ical/:id', async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(404).send('Not found');

	UserModel.findOne({ calendarId: id }).then(async user => {
		if (!user) return res.status(404).send('Not found');
		if (!user.host || !user.firefly) return res.status(403).send('Invalid Firefly account. Please authenticate!');

		let calendar = null;
		try {
			calendar = await generateCalendar(user);
		}
		catch (err) { return res.status(403).send('Invalid Firefly account. Please authenticate!'); }

		res.set('Content-Type', 'text/calendar');
		res.set('Content-Disposition', 'attachment; filename="Firefly Timetable.ics"');
		return res.send(calendar);
	}).catch(err => {
		return res.status(404).send('Not found');
	});
});

module.exports = router;