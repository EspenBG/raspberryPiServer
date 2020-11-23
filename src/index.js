/***********************************************************************************************************************
 * ROBOT SERVER
 * THIS IS A PROGRAM FOR CONTROLLING ROBOTS AND COMMUNICATING WITH A WEBSERVER
 * WRITTEN AS A PART OF THE SUBJECT IELEA2001
 ***********************************************************************************************************************/

/*********************************************************************
 * IMPORTS AND CONSTANTS
 *********************************************************************/

// TODO Add some of the options to the server-config
// TODO Change unit in sensor-config to robot
/*
 * Options for the server-config
 * Port number
 * database paths
 * Passcodes / May be moved to a DB, then the path goes in the server-config
 * Passcode for WebServer
 * automatic storing of data to the database true/false
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

const databasePaths = {
    SensorID: sensorDatabase,
    ControlledItemID: controlledItemDatabase
};


// Import config files
const sensorConfigPath = 'config/sensor-config.json';
const robotConfigPath = 'config/robot-config.json';
const robotConfig = getDatabaseSync(robotConfigPath);
const sensorConfig = getDatabaseSync(sensorConfigPath);

let newSensorData = {       // Object for storing data received from robots in the same structure as the database
    SensorID: {},           // Make the SensorID object
    ControlledItemID: {}    // Make the ControlledItemID object
};

const safeRobotRoom = 'safeRobots';
let unusedPasscodes = [123456789, 123456788];   //TODO: move passcodes to a config file to add the ability to change them
let robotsConnected = {};
let webserverNamespace = io.of('/webserver');
let robotNamespace = io.of('/robot');
const adminNamespace = io.of('/admin');

const serverPort = 3000;

// TODO add the ability to logg other datasets
// TODO: Add compatibility for Firebase

/*********************************************************************
 * MAIN PROGRAM
 *********************************************************************/
// TODO: Add a main program?
// TODO: Refactor the program to use constants for SensorID and ControlledItemID //add to server config
// TODO: Add function to print connected webclients and robots
// TODO: Print message on webclient disconnect

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
    socket.on('sensorInfo', (sensorID, callback) => {
        //console.log(sensorID);
        let sensorInfo = {};
        sensorInfo[sensorID] = sensorConfig['sensor-config'][sensorID]

        socket.emit('sensorInfo', JSON.stringify(sensorInfo), callback);
    });
    socket.on('allSensors', (call) => {
        // Send all the sensors to the client
        if (call) {
            console.log(call);
            // Variable to store all the sensorIDs
            let sensorNames = [];
            // Loop thru all the sensors to add all the names
            Object.keys(sensorConfig['sensor-config']).map((sensor) => {
                // Add all sensorIDs to the array
                sensorNames.push(sensor);
            });
            // Send all the sensorIDs to the client that asked
            let sensorNamesToSend = JSON.stringify(sensorNames)
            socket.emit('allSensors', sensorNamesToSend);
        }
    });
});


// If there in an connection from a robot this runs
robotNamespace.on('connect', (socket) => {
    // Only robots in the robot namespace can send data to the server
    // When a client connects to the server it gets sent to the room for unsafe clients
    let clientID = socket.id;
    let client = io.sockets.connected[clientID];
    robotsConnected[clientID] = {};
    console.log("Client connected with ID: " + clientID);

    socket.on('authentication', (passcode) => {
        if (unusedPasscodes.includes(passcode)) {
            // Remove the passcode so no one else can use the same passcode
            unusedPasscodes = _.without(unusedPasscodes, passcode);
            // Add client to used passcodes with the passcode used
            robotsConnected[clientID]['passcode'] = passcode;
            // Move robot to the safe robots room, and send feedback for successful authentication
            socket.join(safeRobotRoom); //TODO move to after sending of setpoints
            // Send feedback to the robot
            socket.emit('authentication', true);

            printRoomClients(safeRobotRoom); // Used to debug
        } else {
            // Send feedback to the robot that the authentication failed
            socket.emit('authentication', false);
        }
    });

    socket.on('robotID', (robotID) => {
        // TODO: check if all the sensors is in the sensor config and if they have a setpoint
        // Store the robot id together with the clientID
        robotsConnected[clientID]['robotID'] = robotID;
        // Check the database for the sensors connected to the robot
        let sensorConnected = robotConfig['robot-config'][robotID];
        // Collect all the setpoints for the sensors
        let setpointsToSend = {};
        sensorConnected.forEach(sensor => {
            console.log(sensor);
            let setpoint = sensorConfig['sensor-config'][sensor].setpoint;
            setpointsToSend[sensor] = setpoint;

        })
        // Send the setpoints as a JSON object to the robot
        socket.emit('setpoints', JSON.stringify(setpointsToSend));

    })

    // TODO: Change the structure of the event, to make it more uniform
    socket.on('sensorData', (data) => {
        // TODO: check if the unit that is sending data are sending for a sensor that is on the robot
        // Check if the client is authenticated
        // Only log the data if the robot is authenticated and the clientId is valid and in use
        if (socket.rooms[safeRobotRoom] === safeRobotRoom && robotsConnected[clientID] !== undefined) {
            console.log("Received data from: " + clientID);
            // The data from the unit get parsed from JSON to a JS object
            let parsedData = JSON.parse(data);
            let sensorID;
            let dataType;

            if (parsedData['controlledItemID'] !== undefined) {
                // if the data is for the controlled item set the sensorID from that
                sensorID = parsedData['controlledItemID'];
                dataType = 'ControlledItemID';
            } else if (parsedData['sensorID'] !== undefined) {
                // Else the data is from a sensor and the id is the sensorID
                sensorID = parsedData['sensorID'];
                dataType = 'SensorID';
            }

            // the data to add is temperature and timestamp
            let dataObject = {
                'value': parsedData.value,
                'time': Date.now(),
            };
            let sensorData = {};
            sensorData[sensorID] = dataObject;

            // Creates the sensor name object in the new sensor array if it doesn't exist, and adds the new measurement
            newSensorData[dataType][sensorID] = newSensorData[dataType][sensorID] || [];
            newSensorData[dataType][sensorID].push(dataObject);
            console.log('Data added to sensor ' + sensorID + ': ' +
                ' Datatype ' + dataType +
                ', Time ' + dataObject['time'] +
                ', Value ' + dataObject['value']);


            //TODO 2: Make function for sending of the data to the database
            //console.log(parsedData.temperature);
        }
    });


    socket.on('disconnect', (reason) => {
        console.log('Robot:' + clientID + ' disconnected with reason: ' + reason);
        // Remove the passcode from used passcodes and add it to unused passcodes
        if (robotsConnected[clientID] !== undefined) {

            unusedPasscodes.push(robotsConnected[clientID]['passcode']);
            console.log('Passcode used by client can now be reused');
        }

        // Delete the client
        delete robotsConnected[clientID];
        console.log('Removed all information for client: ' + clientID);

    })

})

// This is what runs on all the connections that is NOT in the admin namespace
io.on('connection', (socket) => {

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
    Object.keys(newSensorData).map((dataType) => {

        addDataToDB(databasePaths[dataType], newSensorData, dataType, (numberOfRecords) => {
            // Get how many measurements that was added to the database

            Object.keys(numberOfRecords).map((sensor, index) => {
                // Cycle thru every sensor with measurements that was added
                let numberToDelete = numberOfRecords[sensor];
                // Delete the same number of records that was added to the database (deletes from first)
                newSensorData[dataType][sensor].splice(0, numberToDelete);
                // If all the records for one sensor are added delete that sensor, so there are no empty sensor arrays
                if (Object.keys(newSensorData[dataType][sensor]).length === 0) {
                    delete newSensorData[dataType][sensor];
                }
            });
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
 * @param dataType - The type of data that is going to be added
 * @param callback  - The callback function supplies the number of records that is deleted
 */
function addDataToDB(databasePath, newData, dataType, callback) {

    // Variable to store the sensor name and how many records to delete after import to the database
    let deletedRecords = {};

    // First object is always the dataID, e.g. SensorID
    //let dataType = Object.keys(newData)[0];

    // Read the newest version of the database.
    getDatabase(databasePath, (database) => {
        // Merge the new data one sensor at the time
        Object.keys(newData[dataType]).map((sensor) => {
            deletedRecords[sensor] = 0;

            //Create the data type in the database if it is not there
            database[dataType] = database[dataType] || {};
            console.log('Adding data form sensor: ' + sensor);

            // Create the sensor name in the database if it is not there
            database[dataType][sensor] = database[dataType][sensor] || [];

            // Add every measurement to the database
            newData[dataType][sensor].forEach((measurement) => {
                database[dataType][sensor].push(measurement);

                // Count how many records that is added
                deletedRecords[sensor]++;
            });
        });

        //Convert the new database to JSON
        const jsonDatabase = JSON.stringify(database, null, 2);
        // Write the new database to the path
        fs.writeFile(databasePath, jsonDatabase, (err) => {
            if (err) throw err;
            console.log('Data written to file: ' + databasePath);
        });

        // Callback after the database has been updated, if it is in use
        if (callback) callback(deletedRecords);
    });
}
