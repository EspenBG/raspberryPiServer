
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')();
const session = require('express-session');
const passport = require('passport');

const serverPort = 3000;
const ioServer = io.listen(server);

//io.use(wrap(session({ secret: 'cats' })));
const socketioJwt = require('socketio-jwt');

const adminNamespace = io.of('/admin');

var sio = io.listen(server);
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);


ioServer.use(wrap(session({ secret: 'cats' })));

ioServer.on('connect', (socket) => {
    const session = socket.request.session;
    console.log(socket);
    socket.emit('test', "eneiwfl-aklnsfdakfnelaknsfldakfnsaleknflasknflseklnfes");
    socket.request
});

ioServer.on('connection', (socket)=>{
    socket.emit('test', "eneiwfl-aklnsfdakfnelaknsfldakfnsaleknflasknflseklnfes");
})

server.listen(serverPort);