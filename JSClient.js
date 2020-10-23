const socket = require('socket.io-client')('http://localhost:3000');

socket.on('connect', () => {
    console.log(socket.id); // 'G5p5...'
    socket.emit('dataFromBoard', "fdsfdsfse");
    console.log('datasent');

});

socket.on('connected', () => {
    socket.emit('changeDriveState', true);

});


socket.on('clientConnected', (data, tefdg) => {
    console.log(data +" " + tefdg); // 'G5p5...'
})
