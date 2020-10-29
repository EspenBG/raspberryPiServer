const io = require('socket.io-client');

/********************
 * TEST PARAMETERS
 ********************/
const sensorIDs = ['#####1', '#####2','#####3', '#####4'];
const serverURI = 'http://localhost:3000'; // Alternative: http://localhost/admin:3000
const sendingOfRandomData = false;
const sendingData = true;
const admin = false;

/********************
 * MAIN PROGRAM
 ********************/

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
                    let stringToSend = '{ "sensorId": "' + sensorIDs[index] + '", "temperature": ' + record + '}';
                    socket.emit('temperature', stringToSend);
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


/******************
 * FUNCTIONS
 ******************/

function sendTemperature() {
    // Make a random temperature between 20 and 30 degrees
    let temperatureToSend = 20 + 10 * Math.random();

    // Select a random sensor ID
    // numberOfSensors(randomNum) round to closest int...
    let sensorNumber = Math.floor(Math.random() * sensorIDs.length);
    let sensorID = sensorIDs[sensorNumber];
    let stringToSend = '{ "sensorId": "' + sensorID + '", "temperature": ' + temperatureToSend.toFixed(2) + '}';
    socket.emit('temperature', stringToSend);
    console.log("Sending temperature data: " + stringToSend);
};


function getData() {
    let setting = {
        timeInterval: 0,
        unitIds: 1,
        sensorIds: 1
    }
    const dataSetting = JSON.stringify(setting);
    socket.emit('getData', dataSetting);
}

