const io = require('socket.io-client');

/********************
 * TEST PARAMETERS
 ********************/
const sensorIDs = ['#####1', '#####2'];
const serverURI = 'http://localhost:3000'; // Alternative: http://localhost/admin:3000
const sendingOfRandomData = true;

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
    let myVarNew = setInterval(getData, 3000);
    if (sendingOfRandomData) {
        let myVar = setInterval(sendTemperature, 3000);

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
    socket.emit('getData', settings => {
        let timeInterval = 0;
        let unitIds = 1;
        let sensorIds = 1;
    });
}
