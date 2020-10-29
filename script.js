/*********************************************************************
 * IMPORTS AND CONSTANTS
 *********************************************************************/

const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const _ = require('underscore');
const fs = require('fs');
//const jQuery = require('jQuery') // NOT USED
const sensorDatabase = 'database/sensor-data.json'; // This is the path to the sensor database
let newSensorData = {SensorID: {}};  // Make the SensorID object where each sensor has there own object, see README for structure.

const roomForAuthentication = 'unsafeClients';
let unusedPasscodes = [123456789, 123456788];

const adminNamespace = io.of('/admin');

let test = {
    "value": 24.2,
    "time": 3214214
};

//let data = fs.readFileSync('database/sensor-data.json');
//const parsedData = JSON.parse(data);

// var b = parsedData.SensorID["#####1"][0];
// parsedData.SensorID["#####1"].push(b);

newSensorData.SensorID = newSensorData.SensorID || {};
newSensorData.SensorID["#####2"] = newSensorData.SensorID["#####2"] || [];
newSensorData.SensorID['#####2'].push(test);
console.log(newSensorData["SensorID"]["#####2"]);


//let oldSensorData = readSensorDatabase();

//const sensorDatabase = require('/Users/espen/WebstormProjects/raspberry_pi_server/database/sensor-data.json');

//console.log(sensorDatabase.SensorID["#####1"]);
//var a = sensorDatabase;//JSON.parse('{"SensorID": {"#####1": [{"value": 25.2, "time": 3214214}, {"value": 25.2, "time": 3214214}]}}');

//a.SensorID["#####1"].push(b)//{"value": 25.2, "time": 3214214};
//var c = _.extend(a.SensorID, b);


function addDataToDB(databasePath, newData) {
    // Assumes there is only one type of data, where the first object is the same as the parent object in the database.


    // Read the newest version of the database.
    let dataName = Object.keys(newData)[0];
    getDatabase(databasePath, (database) => {
        // Merge the new data one sensor at the time
        Object.keys(newData[dataName]).map((index, value) => {
            console.log('Adding data form sensor: ' + index);
            database[dataName][index] = database[dataName][index] || [];
            newData[dataName][index].forEach((measurement) => {
                database[dataName][index].push(measurement);
            });
        });

    });

    // Merge old file with new data


    // const stringyfy = JSON.stringify(parsedData, null, 2);
    // fs.writeFile('database/sensor-data.json', stringyfy, (err) => {
    //     if (err) throw err;
    //     console.log('Data written to file');
    // });

}

addDataToDB(sensorDatabase, newSensorData);


// const sensorData = fs.readFile( 'database/sensor-data.json', (err, data) => {
//     if (err) throw err;
//     //console.log(data.toString())
//     return data;
// });
//const parsedFile = JSON.parse(sensorData);

/****************************************
 * MAIN PROGRAM
 ****************************************/


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


        if (parsedSettings.hasOwnProperty('timeInterval')) {
            timeInterval = parsedSettings.timeInterval;
        }
        if (parsedSettings.hasOwnProperty('unitIds')) {
            unitIds = parsedSettings.unitIds;
        }
        if (parsedSettings.hasOwnProperty('sensorIds')) {
            sensorIds = parsedSettings.sensorIds;
        }

        let sensorData = getData(timeInterval, unitIds, sensorIds);
        socket.emit('dataResponse', sensorData);
    });
});


io.on('connection', socket => {
    // TODO: Make the logic for authentication of the clients i.e use passcodes

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
        // TODO 1: Add the timestamp to the object
        console.log("Received data from: " + clientId);
        // The data from the unit get parsed from JSON to a JS object
        let parsedData = JSON.parse(data);

        let sensorId = parsedData.sensorId;
        // the data to add is temperature and timestamp
        let dataObject = {
            value: parsedData.temperature,
            time: Date.now(),
        };
        let sensorData = {};
        sensorData[sensorId] = dataObject;

        console.log(sensorData);
        var data = _.extend(sensorData);

        // the data is added to the sensorId

        //TODO 2: Make function for sending of the data to the database
        //console.log(parsedData.temperature);
    });
});


server.listen(3000);

/*********************************************************************
 * PROGRAM FUNCTIONS
 *********************************************************************/

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
    //TODO: set default parameters
    //TODO: add logic to get data form database
    //TODO 3: Get stored data from JSON file and return the correct data

    let data = {
        "time": "12:30",
        "unitId": 1,
        "sensorId": 1,
        "temperature": 23.4,
    };

    let encodedData = JSON.stringify(data);
    return encodedData
}


/**
 * Function that retrieves a JSON database from a file path.
 * This is an asynchronous function, and executes the callback after loading and parsing the database.
 * @param pathToDb
 * @param callback
 */
function getDatabase(pathToDb, callback) {

    fs.readFile(pathToDb, (err, dataBuffer) => {
        if (err) throw err;
        const database = JSON.parse(dataBuffer);
        console.log(database);
        if (callback) callback(database);
    });
}

