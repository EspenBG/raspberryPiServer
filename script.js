const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

const roomForAuthentication = 'unsafeClients';
let unusedPasscodes = [123456789, 123456788];



io.on('connection', socket => {

    // When a client connects to the server it gets sent to the room for unsafe clients
    let clientId = socket.id;
    let client = io.sockets.connected[clientId];
    console.log("Client connected with id: " + clientId)
    //client.join(roomForAuthentication);
    socket.emit('connected', true);
    client.emit('test', 'fsfsfdf');
    io.on('test', data => {
        console.log(data);
    });
    socket.on('dataFromBoard', function(data) { //This is function that actually receives the data. The earlier one only starts the function.
        
        console.log('user ' + ' gained the data: ' + data);

    });
});




server.listen(3000);


// TODO add parsing of JSON

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