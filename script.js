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
const serverPort = 3000;

const adminNamespace = io.of('/admin');


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
        addDataToDB(sensorDatabase, newSensorData);
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
        // TODO: format print
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
        newSensorData.SensorID[sensorId] = newSensorData.SensorID[sensorId] || [];
        newSensorData.SensorID[sensorId].push(dataObject);


        // the data is added to the sensorId

        //TODO 2: Make function for sending of the data to the database
        //console.log(parsedData.temperature);
    });
});

let var1 = setInterval(addSensorsToDB, 60000);
server.listen(3000);


/*********************************************************************
 * PROGRAM FUNCTIONS
 *********************************************************************/

function addSensorsToDB() {
    addDataToDB(sensorDatabase, newSensorData, (numberOfRecords) => {
        // Get how many measurements that was added to the database

        Object.keys(numberOfRecords).map((sensor, index) => {
            // Cycle thru every sensor with measurements that was added
            let numberToDelete = numberOfRecords[sensor];
            // Delete the same number of records that was added to the database (deletes from first)
            newSensorData.SensorID[sensor].splice(0, numberToDelete)
        });

    })
}

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
    // Error if there are no sensor data
    let lastSensorReading = Object.keys(newSensorData.SensorID['#####2']).length - 1;
    let lastSensorValue = newSensorData.SensorID['#####2'];
    let test = {
        SensorID:
            {
                '#####2': [
                    lastSensorValue[lastSensorReading]
                ]
            }

    };

    let encodedData = JSON.stringify(test);
    return encodedData
}


/**
 * Function that retrieves a JSON database from a file path.
 * This is an asynchronous function, and executes the callback after loading and parsing the database.
 * @param pathToDb
 * @param callback
 */
function getDatabase(pathToDb, callback, error) {

    fs.readFile(pathToDb, (err, dataBuffer) => {
        if (err) throw err;
        try {
            const database = JSON.parse(dataBuffer);

            console.log(database);
            if (callback) callback(database);
        } catch (SyntaxError) {
            //Run error code if there is a SyntaxError in the DB. E.g. DB is not in JSON format
            console.error('Error loading database. No changes has been made to the file.');
            if (error) error();
        } finally {

        }
    });
}


/**
 * Function that
 * @param databasePath
 * @param newData
 */
function addDataToDB(databasePath, newData, callback) {
    // Assumes there is only one type of data, where the first object is the same as the parent object in the database.
    // Variable to store the sensor name and how many records to delete after import to the database
    let deletedRecords = {};

    // First object is always the dataId, e.g. SensorID
    let dataName = Object.keys(newData)[0];

    // Read the newest version of the database.
    getDatabase(databasePath, (database) => {
        // Merge the new data one sensor at the time
        Object.keys(newData[dataName]).map((sensor, index) => {
            deletedRecords[sensor] = 0;

            //Create the data type in the database if it is not there
            database[dataName] = database[dataName] || {};
            console.log('Adding data form sensor: ' + sensor);

            // Create the sensor name in the database if it is not there
            database[dataName][sensor] = database[dataName][sensor] || [];

            // Add every measurement to the database
            newData[dataName][sensor].forEach((measurement) => {
                database[dataName][sensor].push(measurement);

                // Count how many records that is added
                deletedRecords[sensor]++;
            });
        });

        //Convert the new database to JSON
        const jsonDatabase = JSON.stringify(database, null, 2);
        // Write the new database to the path
        fs.writeFile(databasePath, jsonDatabase, (err) => {
            if (err) throw err;
            console.log('Data written to file');
        });

        // Callback after the database has been updated, if it is use
        if (callback) callback(deletedRecords);
    });

    // Merge old file with new data
}
