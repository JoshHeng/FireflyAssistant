# FireflyAssistant
Creates an ical .ics file from your Firefly timetable to be imported in your calendar of choice.

See the [Firefly API](https://github.com/JoshHeng/FireflyAPI) for more information about the API itself

## Environment
* DOMAIN
* MONGOURL
* SECRET
* PORT
* SECRETKEY - can be generated with `generateSecretKey.js` (hex 32 byte random string)

## Docker
### Building
1. Run `docker build --tag fireflyassistant:latest .`
2. Run `docker save -o fireflyassistant.tar fireflyassistant:latest`

### Running
1. Run `docker run -p 3001:3001 --name=fireflyassistant -e DOMAIN=domain [-e etc] fireflyassistant`
