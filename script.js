const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);


io.on('connect', socket => {
    console.log("User connected");

    let clientId = socket.id;
    console.log(clientId);
    let client = io.sockets.connected[clientId];

    client.emit('test', 5)

})

server.listen(3000);

