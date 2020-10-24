const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const roomForAuthentication = 'unsafeClients';
let unusedPasscodes = [123456789, 123456788];

const adminNamespace = io.of('/admin');

adminNamespace.use((socket, next) => {
    // ensure the user has sufficient rights
    // TODO add logic to check if the admin has the correct rights
    console.log("Admin Logged in")
    next();
});


adminNamespace.on('connection', socket => {
    console.log('TESTETETERFDC');
    socket.on('getData', settings => {
        console.log('Data request received from admin')
        let timeInterval = [0];   // is an array containing the start time and stop time
        let unitIds = [0];        // is an array containing all the unitIds to get sensor data for
        let sensorIds = [0];      // is an array containing all the sensorIds to get data for
        let parsedSettings = JSON.parse(settings)


        if (parsedSettings.hasOwnProperty('timeInterval'))  {
            timeInterval = parsedSettings.timeInterval;
        }
        if (parsedSettings.hasOwnProperty('unitIds'))  {
            unitIds = parsedSettings.unitIds;
        }
        if (parsedSettings.hasOwnProperty('sensorIds'))  {
            sensorIds = parsedSettings.sensorIds;
        }

        let sensorData = getData(timeInterval, unitIds, sensorIds);
        socket.emit('dataResponse', sensorData);
    });
});

io.on('connection', socket => {

    // When a client connects to the server it gets sent to the room for unsafe clients
    let clientId = socket.id;
    let client = io.sockets.connected[clientId];
    console.log("Client connected with id: " + clientId)
    //client.join(roomForAuthentication);
    //socket.emit('connected', true);
    client.emit('test', 'fsfsfdf');
    io.on('test', data => {
        console.log(data);
    });
    socket.on('temperature', (data) => {
        // TODO: Add the timestamp to the object
        console.log("Received data from: " + clientId);
        // The data from the unit get parsed from JSON to a JS object
        let parsedData = JSON.parse(data)
        //TODO: Make function for sending of the data to the database
        //console.log(parsedData.temperature);
    });
});




server.listen(3000);


// TODO add parsing of JSON

/**
 * Prints all the connected sockets in the room
 * @param roomName
 */
function printRoomClients(roomName) {
    let clients = io.in(roomName).connected;
    for (const socket in clients) {
        console.log(socket);
    }
}


/**
 * Function to get data from the database, and returns the data as a JSON file
 * The data that is returned is controlled by the parameters. If there are any missing parameters
 * or is invalid (i.e. the stop time is before start time) the default values are used.
 * @param timeInterval  array containing the start time and the stop time
 * @param unitIds       array containing the unitIds
 * @param sensorIds     array containing the sensorIds
 * @returns {string}    the encoded JSON string
 */
function getData(timeInterval, unitIds, sensorIds) {
    //TODO set default parameters
    //TODO add logic to get data form database
    let data = {
        "time": "12:30",
        "unitId": 1,
        "sensorId": 1,
        "temperature": 23.4,
    };

    let encodedData = JSON.stringify(data);
    return encodedData
}