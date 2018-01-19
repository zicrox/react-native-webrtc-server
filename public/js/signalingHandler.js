// Signaling socket events handler

socket.on('exchange', function(data){
  // console.log('socket.on exchange', data);
  // Some one has created offer in RTCPeerConnection
  // Exchange ice candidates (RTCSessionDescription)
  signalingExchange(data);
});

socket.on('leave', function(socketId){
  // console.log('socket.on leave', socketId);
  socketLeave(socketId);
});

socket.on('connect', function() {
  console.info('socket.on connect:', socket);
  getLocalStream();
});