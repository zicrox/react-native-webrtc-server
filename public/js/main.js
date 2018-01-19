
// var socket = io();
// var socket = io("http://localhost:4444");
var socket = io("https://react-native-webrtc.herokuapp.com");

// get webrtc methods unprefixed
// Inspiration: https://github.com/substack/get-browser-rtc
// var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
// var RTCPeerConnection = RTCPeerConnectionLogger();
var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var selfView = document.getElementById("selfView");
var remoteViewContainer = document.getElementById("remoteViewContainer");
var pcPeers = {};
var localStream;

function createPC(socketId, isOffer) {
  var pc = new RTCPeerConnectionLogger2(configuration);
  pcPeers[socketId] = pc;

  pc.onicecandidate = function (event) {
    if (event.candidate)
      socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
  }

  pc.onnegotiationneeded = function (event) {
    if (isOffer)
      pcCreateOffer(pc, socketId);
  }

  pc.oniceconnectionstatechange = function(event) {
    // pc.iceConnectionState constants:
    // checking, closed, completed, connected, disconnected, failed, new
    renderConnectionStatus(event);
  }
  
  pc.onsignalingstatechange = function(event) {
    // pc.signalingState constants:
    // have-remote-offer, have-local-offer, stable, closed
  }

  // TODO deprecated use ontrack
  // https://github.com/webrtc/samples/pull/902/files
  pc.onaddstream = function (event) {
    pcOnaddstream(event, socketId);
  }
  
  // TODO deprecated use addTrack
  pc.addStream(localStream);
  
  var endLogger = pc.subscribeLogger(console.log);
  
  // var instanceDataToLogger = {
  //   socketId: socketId,
  //   isOffer: isOffer,
  //   getStats: true
  // }
  // pc.startLogger(instanceDataToLogger);
  pc.startLogger();
  
  return pc;
}

function pcOnaddstream(event, socketId) {
  var element = document.createElement('video');
  element.id = "remoteView" + socketId;
  element.autoplay = 'autoplay';
  element.src = URL.createObjectURL(event.stream);
  remoteViewContainer.appendChild(element);
}

function pcCreateOffer(pc, socketId) {
  console.log('createOffer');
  pc.createOffer(function(desc) {
    pc.setLocalDescription(desc, function () {
      // console.log('🎁🎁🎁 setLocalDescription', pc.localDescription.type);
      socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
    }, logError);
  }, logError);
}

function pcCreateAnswer(pc, fromId, data) {
  pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
    if (pc.remoteDescription.type === "offer"){
      pc.createAnswer(function(desc) {
        console.log('createAnswer');
        pc.setLocalDescription(desc, function () {
          // console.log('🎁🎁🎁 setLocalDescription', pc.localDescription.type);
          socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
        }, logError);
      }, logError);
    }
  }, logError);
}

function signalingExchange(data) {
  // console.log('🤑🤑🤑 exchange');
  var fromId = data.from;
  var pc;
  // If pc is not register: craete NO OFFER peer connection
  if (fromId in pcPeers) {
    pc = pcPeers[fromId];
  } else {
    pc = createPC(fromId, false);
  }
  // SDP messages
  if (data.sdp) {
    console.log('💚💚💚 exchange sdp');
    pcCreateAnswer(pc, fromId, data);
  }
  // ICE messages
  if(data.candidate) {
    console.log('💙💙💙 exchange candidate');
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

function getLocalStream() {
  navigator.getUserMedia({ "audio": true, "video": false }, function (stream) {
    localStream = stream;
    selfView.src = URL.createObjectURL(stream);
    selfView.muted = true;
  }, logError);
}

function join(roomID) {
  socket.emit('join', roomID, function(socketIds){
    console.log('join', socketIds);
    for (var i in socketIds) {
      var socketId = socketIds[i];
      // craete OFFER peer connection
      createPC(socketId, true);
    }
  });
}

// Controled by event in signaling socket
// Also will can control this with "oniceconnectionstatechange"
function socketLeave(socketId) {
  console.log('leave', socketId);
  var pc = pcPeers[socketId];
  pc.close();
  delete pcPeers[socketId];
  var video = document.getElementById("remoteView" + socketId);
  if (video) video.remove();
}

function logError(error) {
  console.log("logError", error);
}

