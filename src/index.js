/***********************************************************************************************************************
 * ROBOT SERVER
 * THIS IS A PROGRAM FOR CONTROLLING ROBOTS AND COMMUNICATING WITH A WEBSERVER
 * WRITTEN AS A PART OF THE SUBJECT IELEA2001
 ***********************************************************************************************************************/

/*********************************************************************
 * IMPORTS AND CONSTANTS
 *********************************************************************/

// TODO Add some of the options to the server-config
/*
 * Options for the server-config
 * Port number
 * database paths
 * Passcodes / May be moved to a DB, then the path goes in the server-config
 * Passcode for WebServer
 *
 */

/*
 * Options for the robot-config, this is used as a DB with an overview of what sensor is connected to the different robots
 * unitID: sensor1, sensor2, sensor3
 */


const EventEmitter = require('eventemitter3');
const emitter = new EventEmitter();
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const _ = require('underscore');
const fs = require('fs');
//const jQuery = require('jQuery') // NOT USED ANYMORE
const session = require('express-session');
const passport = require('passport');

const sensorDatabase = 'database/sensor-data.json'; // This is the path to the sensor database //TODO move to server-config
const controlledItemDatabase = 'database/controlled-item-data.json'; // This is the path to the controlled item database //TODO move to server-config

// Import config files
const robotConfig = getDatabaseSync('config/robot-config.json');
const sensorConfig = getDatabaseSync('config/sensor-config.json');

let newSensorData = {       // Object for storing data received from robots in the same structure as the database
    SensorID: {},           // Make the SensorID object
    ControlledItemID: {}    // Make the ControlledItemID object
};

const safeRobotRoom = 'safeRobots';
let unusedPasscodes = [123456789, 123456788];
let passcodesInUse = {};
let usedPasscodes = {};
let webserverNamespace = io.of('/webserver');
let robotNamespace = io.of('/robot')
const serverPort = 3000;

const adminNamespace = io.of('/admin');
// TODO add the ability to logg other datasets

/*********************************************************************
 * MAIN PROGRAM
 *********************************************************************/
// TODO: Add a main program?
webserverNamespace.use((socket, next) => {
    // ensure the user has sufficient rights
    console.log("Client from webserver connected")
    next();
});


// If there is an connection from an admin this runs
webserverNamespace.on('connection', socket => {
    socket.on('getData', settings => {
        //addDataToDB(sensorDatabase, newSensorData);
        console.log('Data request received from a webpage')
        let startTime = 0;   // Default start time is 0ms
        let stopTime = 0;    // Default stop time is 0ms
        let sensorID;        // There NO default sensor
        let dataType = 'SensorID' // Default datatype is sensor id
        let parsedSettings = JSON.parse(settings)

        // Change the default parameters if they are specified
        if (parsedSettings.hasOwnProperty('startTime')) {
            startTime = parsedSettings.startTime;
        }
        if (parsedSettings.hasOwnProperty('stopTime')) {
            stopTime = parsedSettings.stopTime;
        }
        if (parsedSettings.hasOwnProperty('dataType')) {
            dataType = parsedSettings.dataType;
        }
        // If there is no sensor ID there are no sensor data to retrieve
        if (parsedSettings.hasOwnProperty('sensorID')) {
            sensorID = parsedSettings.sensorID;
            // Get the sensor data
            getData(startTime, stopTime, sensorID, dataType, (sensorData) => {
                // Sort the data by time
                let sortedData = _.sortBy(sensorData, 'time');

                let dataToSend = {};
                // The data is sent as an object under the name of the sensor and the datatype
                dataToSend[dataType] = {};
                dataToSend[dataType][sensorID] = sortedData;

                let encodedData = JSON.stringify(dataToSend);
                socket.emit('dataResponse', encodedData);
            });
        }
    });
});

robotNamespace.on('connect', (socket) => {
    // Only robots in the robot namespace can send data to the server
    // When a client connects to the server it gets sent to the room for unsafe clients
    let clientID = socket.id;
    let client = io.sockets.connected[clientID];
    console.log("Client connected with ID: " + clientID);

    socket.on('authentication', (passcode) => {
        if (unusedPasscodes.includes(passcode)) {
            // Remove the passcode so no one else can use the same passcode
            unusedPasscodes = _.without(unusedPasscodes, passcode);
            // Move robot to the safe robots room, and send feedback for successful authentication
            socket.join(safeRobotRoom);
            // Send feedback to the robot
            socket.emit('authentication', true)
            // TODO: add the passcode to the used passcode array
            printRoomClients(safeRobotRoom); // Used to debug
        } else {
            // Send feedback to the robot that the authentication failed
            socket.emit('authentication', false);
        }
    });
    // TODO: Change the structure of the event, to make it more uniform
    socket.on('sensorData', (data) => {
        if (socket.rooms[safeRobotRoom] === safeRobotRoom) {
            // TODO: format print
            console.log("Received data from: " + clientID);
            // The data from the unit get parsed from JSON to a JS object
            let parsedData = JSON.parse(data);
            let sensorID;
            let dataType = 'SensorID';
            if (parsedData['controlledItemID'] !== undefined) {
                // if the data is for the controlled item set the sensorID from that
                sensorID = parsedData['ControlledItemID'];
                dataType = 'ControlledItemID';
            } else {
                // Else the data is from a sensor and the id is the sensorID
                sensorID = parsedData['SensorID'];
            }

            // the data to add is temperature and timestamp
            let dataObject = {
                'value': parsedData.value,
                'time': Date.now(),
            };
            let sensorData = {};
            sensorData[sensorID] = dataObject;

            // TODO: format the measurement in a cleaner way
            // Creates the sensor name object in the new sensor array if it doesn't exist, and adds the new measurement
            newSensorData[dataType][sensorID] = newSensorData[dataType][sensorID] || [];
            newSensorData[dataType][sensorID].push(dataObject);
            console.log('Data added to sensor data \n'
                + 'Datatype: '
                + dataType + 'Time: '
                + dataObject['value'] + 'Value: '
                + dataObject['time']);


            //TODO 2: Make function for sending of the data to the database
            //console.log(parsedData.temperature);
        }
    });

})
// TODO: add logic to check if the robot sending data has been authenticated
// TODO: move sensorData to the correct room

// This is what runs on all the connections that is NOT in the admin namespace
io.on('connection', socket => {
    // TODO: Make the logic for authentication of the clients i.e use passcodes


    //client.join(roomForAuthentication);
    //socket.emit('connected', true);
    //client.emit('test', 'test text');
    io.on('test', data => {
        console.log(data);

    });

});

// Write new sensor data to the database every 60 seconds
let var1 = setInterval(addSensorsToDB, 60000);

// Start the server on port specified in the server-config
// TODO: Add port to server-config
server.listen(serverPort);


/*********************************************************************
 * PROGRAM FUNCTIONS
 *********************************************************************/

/**
 * Function to add sensor data to the database
 */
function addSensorsToDB() {
    addDataToDB(sensorDatabase, newSensorData, (numberOfRecords) => {
        // Get how many measurements that was added to the database

        Object.keys(numberOfRecords).map((sensor, index) => {
            // Cycle thru every sensor with measurements that was added
            let numberToDelete = numberOfRecords[sensor];
            // Delete the same number of records that was added to the database (deletes from first)
            newSensorData.SensorID[sensor].splice(0, numberToDelete);
            // If all the records for one sensor are added delete that sensor, so there are no empty sensor arrays
            if (Object.keys(newSensorData.SensorID[sensor]).length === 0) {
                delete newSensorData.SensorID[sensor];
            }
        });
    });
}


/**
 * Prints all the connected sockets in the room
 * @param roomName
 */
function printRoomClients(roomName) {
    let clients = io.in(roomName).connected;
    console.log('Clients in room ' + roomName)
    for (const socket in clients) {
        console.log('   ' + socket);
    }
}


/**
 * Function to get data from the database and form newSensorData, and returns the data as an object
 * The time interval for teh search is controlled by the start time and the stop time.
 * If the stop time is 0 the search return all the sensor data from the start time to the time of the search.
 * @param startTime     start time of the search (time in ms from 01.01.1970)
 * @param stopTime      stop time for the search (time in ms from 01.01.1970)
 * @param sensorID      name of the sensor, the sensorID
 * @param dataType      Specifies the type of data to search for (e.g. SensorID or ControlledItemID)
 * @param callback      Runs the callback with the sensor data for the sensor specified
 */
function getData(startTime, stopTime, sensorID, dataType, callback) {
    // TODO: check for the correct datatype and add the possibility to get data from different data types
    // let dataType = "SensorID";
    let sensorData = [];    // Variable to store all the sensor data

    // If there are no specified stop time, the stoptime is set to the time of the search
    if (stopTime === 0 || stopTime === undefined) {
        stopTime = Date.now();
    }

    // Get all the sensor data that is not in the database
    let dataFromSensorArray = newSensorData[dataType][sensorID];

    // Check if there are any sensor data in the last sensor reading
    if (dataFromSensorArray !== undefined) {
        // Get all the measurements in the correct time period
        getSensorMeasurements(dataFromSensorArray, startTime, stopTime, (measurements) => {
            sensorData = sensorData.concat(measurements);
        });
    }

    // Get all the records in the correct time interval from the database
    getDatabase(sensorDatabase, (database) => {
        let sensorDataFromDB = database[dataType][sensorID];
        // Check if there are any sensor data for the sensor in the DB
        if (sensorDataFromDB !== undefined) {
            // Get all the measurements in the correct time period
            getSensorMeasurements(sensorDataFromDB, startTime, stopTime, (measurements) => {
                // Append the data to the array
                sensorData = sensorData.concat(measurements);
            });
        }
        // Run the callback if specified with the sensor data from BOTH the database and the new sensor data
        if (callback) callback(sensorData);

    }, error => {
        // If there is an error accessing the database, print an error message
        console.log("There was an error accessing the database");
        // Run the callback if specified with only the data NOT in the database
        if (callback) callback(sensorData);
    });

}


function getSensorMeasurements(placeToCheck, startTime, stopTime, callback) {
    let correctData = [];
    // Check if the time of the reading are inline with the time requirements
    Object.keys(placeToCheck).map((data, index) => {

        // Check if the time of measurement is in the interval between startTime and stopTime
        if (placeToCheck[index].time >= startTime && placeToCheck[index].time <= stopTime) {
            // Add measurement to the sensorData
            correctData.push(placeToCheck[index]);
        }
    })

    if (callback) callback(correctData);
}


/**
 * Function that retrieves a JSON database from a file path.
 * This is an asynchronous function, and executes the callback after loading and parsing the database.
 * @param pathToDb
 * @param callback
 * @param error Runs if there is an error on reading the database
 */
function getDatabase(pathToDb, callback, error) {
    // Read the database and parse it from JSON format to JS object.
    fs.readFile(pathToDb, (err, dataBuffer) => {
        if (err) throw err;
        try {
            // Parse the JSON database to a JS object
            const database = JSON.parse(dataBuffer);

            //Run callback if it is defined
            if (callback) {
                callback(database);
            } else {
                // Return the database if there is no callback
                return database
            }
        } catch (SyntaxError) {
            //Run error code if there is a SyntaxError in the DB. E.g. DB is not in JSON format
            console.error('Error loading database. No changes has been made to the file.');
            if (error) error();
        }
    });
}


/**
 * Function that retrieves a JSON database from a file path.
 * This is an synchronous function, and returns the database as a JS object.
 * @param pathToDb  Path to the database
 * @param error Runs if there is an error on reading the database
 * @return databse Returned as a JS object
 */
function getDatabaseSync(pathToDb, error) {
    // Read the database and parse it from JSON format to JS object.
    try {
        let database = fs.readFileSync(pathToDb);
        // Parse the JSON database to a JS object
        return JSON.parse(database);

    } catch (SyntaxError) {
        //Run error code if there is a SyntaxError in the DB. E.g. DB is not in JSON format
        console.error('Error loading database. No changes has been made to the file.');
        if (error) error();
    }
}


/**
 * Function that first reads the database stored on the supplied path and add the data supplied to the database.
 * The function assumes there is only one type of data that is going to be added to the database.
 * You need to delete the data after it is added to the database, the callback function can be used for this.
 * @param databasePath
 * @param newData  - Object contains all the sensor data the first object is the same as the parent object in the database.
 * @param callback  - The callback function supplies the number of records that is deleted
 */
function addDataToDB(databasePath, newData, callback) {
    // TODO: Make it possible to add multiple datatypes
    // Assumes there is only one type of data,
    // Variable to store the sensor name and how many records to delete after import to the database
    let deletedRecords = {};

    // First object is always the dataID, e.g. SensorID
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

        // Callback after the database has been updated, if it is in use
        if (callback) callback(deletedRecords);
    });
}
