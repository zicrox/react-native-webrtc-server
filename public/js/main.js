
// var socket = io();
// var socket = io("http://localhost:4444");
var socket = io.connect('https://blynce.com:7050', {secure: true, transports: ['websocket']})
// var socket = io.connect('https://blynce.com', {secure: true, transports: ['websocket'], path: '/react-webrtc'})
// var socket = io.connect('https://blynce.com', {secure: true, transports: ['xhr-polling'], path: '/react-webrtc'})
// var socket = io('https://blynce.com', {path: '/react-webrtc'})
// var socket = io("https://react-native-webrtc.herokuapp.com");

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
  var endLogger = pc.subscribeLogger(console.log);
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
  pc.addStream(localStream, logError);
  
  pc.startEventHandlersLogger();
  
  return pc;
}

function pcOnaddstream(event, socketId) {
  var element = document.createElement('video');
  element.id = "remoteView" + socketId;
  element.autoplay = 'autoplay';
  // selfView.src = URL.createObjectURL(event.stream);
  element.srcObject = event.stream;
  remoteViewContainer.appendChild(element);
}

// TODO migrate "flow" from callback to promise

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
    console.log(stream);
    // selfView.src = URL.createObjectURL(stream);
    selfView.srcObject = stream;
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

function _getStats(iterations) {
  console.log('try to getStats');
  // console.log('pcPeers',Object.keys(pcPeers));
  const pc = pcPeers[Object.keys(pcPeers)[0]];
  if (pc && pc.getRemoteStreams()[0] && pc.getRemoteStreams()[0].getAudioTracks()[0]) {
    // const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    // console.log('pc.getRemoteStreams()',pc.getRemoteStreams());
    // console.log('getAudioTracks()',pc.getRemoteStreams()[0].getAudioTracks());
    // console.log('getStats track',track);
    // pc.getStats(track, function(report) {
    //   console.log('getStats REMOTE report', report);
    // }, logError);
    pc.getStats()
      .then(function(stats) {
        console.log('getStats REMOTE report', stats);
        stats.forEach(function(report, stat) {
          // console.log(report);
          // console.log(stat);
        });
      })
      .catch(function(error) {
        console.log("err", error);
      });
  }
  iterations = iterations || 0;
  if (iterations <= 2){
    iterations++;
    setTimeout(_getStats.bind(this, iterations), 3000);
  }
}
_getStats();
// setInterval(_getStats, 3000);



