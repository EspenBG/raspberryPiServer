/***********************************************************************************************************************
 * JS ROBOT CLIENT
 * THIS IS A PROGRAM FOR TESTING OF THE ROBOT SERVER
 * WRITTEN AS A PART OF THE SUBJECT IELEA2001
 ***********************************************************************************************************************/

const io = require('socket.io-client');

/*********************************************************************
 * TEST PARAMETERS
 *********************************************************************/
const sensorIDs = ['#####1', '#####2','#####3', '#####4'];
const serverURI = 'http://localhost:3000'; // Alternative: http://localhost/admin:3000
const sendingOfRandomData = true;
const sendingData = true;
const admin = false;
//TODO 1: Add the possibility to send a passcode to authenticate the connection to the robot server

//TODO 2: Add function to receive setpoints for the sensor

//TODO 3: Add the function to send the unitId to the server

//TODO 4: Add

/*********************************************************************
 * MAIN PROGRAM
 *********************************************************************/

// Connect to the server specified
const socket = io(serverURI, {
    reconnectionDelayMax: 10000,
    //namespace: '/admin',
});


socket.on('connect', () => {
    console.log(socket.id);
    console.log(socket.nsp);
    if (admin) {
        let myVarNew = setInterval(getData, 3000);
    }
    if (sendingData) {
        if (sendingOfRandomData) {
            let myVar = setInterval(sendTemperature, 3000);
        } else {
            let numberOfRecords = 100;
            Object.keys(sensorIDs).map((index, value) => {
                let record = 0;
                for (record = 0; record < numberOfRecords; record++) {
                    let stringToSend = '{ "sensorID": "' + sensorIDs[index] + '", "temperature": ' + record + '}';
                    socket.emit('sensorData', stringToSend);
                    console.log('sending data for sensor: ' + sensorIDs[index] +' Value: '+ record);
                }
            });
        }
    }
});


socket.on('connected', () => {
    socket.emit('changeDriveState', true);

});

socket.on('clientConnected', (data, tefdg) => {
    console.log(data + " " + tefdg); // 'G5p5...'
})


/*********************************************************************
 * FUNCTIONS
 *********************************************************************/

function sendTemperature() {
    // Make a random temperature between 20 and 30 degrees
    let temperatureToSend = 20 + 10 * Math.random();

    // Select a random sensor ID
    // numberOfSensors(randomNum) round to closest int...
    let sensorNumber = Math.floor(Math.random() * sensorIDs.length);
    let sensorID = sensorIDs[sensorNumber];
    let stringToSend = '{ "sensorID": "' + sensorID + '", "temperature": ' + temperatureToSend.toFixed(2) + '}';
    socket.emit('temperature', stringToSend);
    console.log("Sending temperature data: " + stringToSend);
};


function getData() {
    let setting = {
        timeInterval: 0,
        unitIDs: 1,
        sensorIDs: 1
    }
    const dataSetting = JSON.stringify(setting);
    socket.emit('getData', dataSetting);
}

