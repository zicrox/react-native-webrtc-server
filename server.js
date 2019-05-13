var express = require('express');
var app = express();
var fs = require('fs');
var open = require('open');
var morgan = require('morgan')
var options = {
  // key: fs.readFileSync('./fake-keys/privatekey.pem'),
  // cert: fs.readFileSync('./fake-keys/certificate.pem')
  key: fs.readFileSync('./blynce-keys/privatekey.pem'),
  cert: fs.readFileSync('./blynce-keys/certificate.pem')
};
var serverPort = (process.env.PORT  || 4443);
var https = require('https');
var http = require('http');
var server;
var roomList = {};
process.env.LOCAL ? 
  server = https.createServer(options, app) :
  server = http.createServer(app);
var io = require('socket.io')(server); // also serves /socket.io/socket.io.js

//## TODO implements with nginex proxy ssl
// https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/
// https://github.com/REBELinBLUE/deployer/issues/310

app.use(morgan('dev')); // log every request to the console
app.use(express.static('public'));
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

server.listen(serverPort, function(){
  console.log('server up and running at %s port', serverPort);
  if (process.env.LOCAL) {
    open('https://localhost:' + serverPort)
  }
});

// Create room if not exists
// return: socket Ids In Room
function socketIdsInRoom(name) {
  var socketIds = io.nsps['/'].adapter.rooms[name];
  if (socketIds) {
    var collection = [];
    for (var key in socketIds) {
      collection.push(key);
    }
    return collection;
  } else {
    return [];
  }
}

io.on('connection', function(socket){
  console.log('connection');
  socket.on('disconnect', function(){
    console.log('disconnect');
    if (socket.room) {
      io.to(socket.room).emit('leave', {socketId: socket.id});
      socket.leave(socket.room);
    }
  });

  // Create / join room
  socket.on('join', function(joinData, callback){
    console.log('join', joinData.name);
    io.to(joinData.name).emit('join');
    socket.broadcast.emit('join', joinData);
    var socketIds = socketIdsInRoom(joinData.name);
    callback(socketIds);
    socket.join(joinData.name);
    socket.room = joinData.name;
  });
  
  // Leave room
  socket.on('leave', function(leaveData, callback){
    console.log('try to leave', leaveData.name);
    if (socket.room) {
      console.log('leave', leaveData.name);
      if(leaveData.broadcast){
        // Old only broadcast to room
        // io.to(socket.room).emit('leave', socket.id);
        socket.broadcast.emit('leave', {socketId: socket.id, jid: leaveData.jid});
      }
      socket.leave(socket.room);
      callback();
    }
  });


  socket.on('exchange', function(data){
    console.log('exchange', data);
    data.from = socket.id;
    var to = io.sockets.connected[data.to];
    to.emit('exchange', data);
  });
});
