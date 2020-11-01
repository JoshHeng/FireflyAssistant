# Firefly Assistant
![Docker Cloud Automated build](https://img.shields.io/docker/cloud/automated/joshheng/fireflyassistant) ![Docker build](https://img.shields.io/docker/cloud/build/joshheng/fireflyassistant)

> Available at https://firefly.joshheng.co.uk

Firefly Assistant is an unofficial service for the [Firefly Learning school platform](https://fireflylearning.com/) that enables you to convert your timetable into a live iCalendar file (so it can be shown in your own calendar, e.g. on your phone)

Please note that this service is not affiliated in any way with Firefly Learning.

See the [Firefly API](https://github.com/JoshHeng/FireflyAPI) for more information about the API itself

## Running
### Dependencies
* MongoDB
* Node.JS

### Environment Variables
* `DOMAIN` - domain of the instance
* `MONGOURL` - url (including db name) of the MongoDB database
* `SECRET` - secret
* `PORT` - port (defaults to 3000)
* `SECRETKEY` - 32 byte hex secret that can be generated with `generateSecretKey.js`
  
### Nodemon
1. Install dependencies with `npm install`
2. Start nodemon with `npm start`

### Docker
This is available on Docker Hub at [joshheng/fireflyassistant](https://hub.docker.com/repository/docker/joshheng/fireflyassistant)

To build, run `docker build --tag fireflyassistant:latest .`
To run, run `docker run -p 3001:3001 --name=fireflyassistant -e DOMAIN=domain [-e etc] fireflyassistant`