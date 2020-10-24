const io = require('socket.io-client')

const socket = io('http://localhost:3000', {
    reconnectionDelayMax: 10000,
    //namespace: '/admin',
});

function getData() {
    socket.emit('getData', settings => {
        let timeInterval = ;
        let unitIds = 001;
        let sensorIds = 001;
    });
}

socket.on('connect', () => {
    console.log(socket.id); // 'G5p5...'
    let myVar = setInterval(alertFunc, 3000);
    let myVarNew = setInterval(getData, 3000);
    //console.log('temperature');

    });

function myFunction() {
}

function alertFunc() {
    console.log("Hello!");
    socket.emit('temperature', '{ "unitId": "001", "sensorId": "001", "temperature": 25}');

}

socket.on('connected', () => {
    socket.emit('changeDriveState', true);

});


socket.on('clientConnected', (data, tefdg) => {
    console.log(data +" " + tefdg); // 'G5p5...'
})
