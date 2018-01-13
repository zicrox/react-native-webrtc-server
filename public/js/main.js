
// var socket = io();
var socket = io("https://react-native-webrtc.herokuapp.com");
// var socket = io("http://localhost:4444");

var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

var twilioIceServers = [
     { url: 'stun:global.stun.twilio.com:3478?transport=udp' }
     // { url: 'turn:global.turn.twilio.com:3478?transport=udp',
     //   username: 'ea757ad2c42b932c7f2abe480295e7eb039dc2b13b78c86bc412818ed51e5eea',
     //   credential: 'MPnnojPRoPDI+B3kLONGF9P440Lb8NkrTq+FxxJBVro=' },
     // { url: 'turn:global.turn.twilio.com:3478?transport=tcp',
     //   username: 'ea757ad2c42b932c7f2abe480295e7eb039dc2b13b78c86bc412818ed51e5eea',
     //   credential: 'MPnnojPRoPDI+B3kLONGF9P440Lb8NkrTq+FxxJBVro=' },
     // { url: 'turn:global.turn.twilio.com:443?transport=tcp',
     //   username: 'ea757ad2c42b932c7f2abe480295e7eb039dc2b13b78c86bc412818ed51e5eea',
     //   credential: 'MPnnojPRoPDI+B3kLONGF9P440Lb8NkrTq+FxxJBVro=' } 
];
var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
// configuration.iceServers = twilioIceServers;

var pcPeers = {};
var selfView = document.getElementById("selfView");
var remoteViewContainer = document.getElementById("remoteViewContainer");
var localStream;

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

function createPC(socketId, isOffer) {
  console.log('createPC', socketId, isOffer);
  var pc = new RTCPeerConnection(configuration);
  pcPeers[socketId] = pc;

  pc.onicecandidate = function (event) {
    console.log('onicecandidate', event);
    if (event.candidate) {
      socket.emit('exchange', {'to': socketId, 'candidate': event.candidate });
    }
  };

  function createOffer() {
    console.log('💰💰💰 createOffer');
    pc.createOffer(function(desc) {
      console.log('createOffer', desc);
      pc.setLocalDescription(desc, function () {
        console.log('🎁🎁🎁 setLocalDescription', pc.localDescription.type);
        socket.emit('exchange', {'to': socketId, 'sdp': pc.localDescription });
      }, logError);
    }, logError);
  }

  pc.onnegotiationneeded = function () {
    console.log('onnegotiationneeded');
    if (isOffer) {
      createOffer();
    }
  }

  pc.oniceconnectionstatechange = function(event) {
    console.log('oniceconnectionstatechange', event);
    if (event.target.iceConnectionState === 'connected') {
      createDataChannel();
    }
  };
  pc.onsignalingstatechange = function(event) {
    console.log('onsignalingstatechange', event);
  };

  pc.onaddstream = function (event) {
    console.log('onaddstream', event);
    var element = document.createElement('video');
    element.id = "remoteView" + socketId;
    element.autoplay = 'autoplay';
    element.src = URL.createObjectURL(event.stream);
    remoteViewContainer.appendChild(element);
  };
  pc.addStream(localStream);
  function createDataChannel() {
    if (pc.textDataChannel) {
      return;
    }
    var dataChannel = pc.createDataChannel("text");

    dataChannel.onerror = function (error) {
      console.log("dataChannel.onerror", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("dataChannel.onmessage:", event.data);
      var content = document.getElementById('textRoomContent');
      content.innerHTML = content.innerHTML + '<p>' + socketId + ': ' + event.data + '</p>';
    };

    dataChannel.onopen = function () {
      console.log('dataChannel.onopen');
      var textRoom = document.getElementById('textRoom');
      textRoom.style.display = "block";
    };

    dataChannel.onclose = function () {
      console.log("dataChannel.onclose");
    };

    pc.textDataChannel = dataChannel;
  }
  return pc;
}

function exchange(data) {
  console.log('🤑🤑🤑 exchange');
  var fromId = data.from;
  var pc;
  if (fromId in pcPeers) {
    pc = pcPeers[fromId];
  } else {
    // craete NO OFFER peer connection: only exchange ice candidates
    pc = createPC(fromId, false);
  }

  if (data.sdp) {
    console.log('💚💚💚 exchange sdp', data);
    pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
      if (pc.remoteDescription.type === "offer"){
        pc.createAnswer(function(desc) {
          console.log('createAnswer', desc);
          pc.setLocalDescription(desc, function () {
            console.log('🎁🎁🎁 setLocalDescription', pc.localDescription.type);
            socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
          }, logError);
        }, logError);
      }
    }, logError);
  } else {
    console.log('💙💙💙 exchange candidate', data);
    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
}

function leave(socketId) {
  console.log('leave', socketId);
  var pc = pcPeers[socketId];
  pc.close();
  delete pcPeers[socketId];
  var video = document.getElementById("remoteView" + socketId);
  if (video) video.remove();
}

socket.on('exchange', function(data){
  console.log('socket.on exchange', data);
  // Some one has created offer in RTCPeerConnection
  // Exchange ice candidates (RTCSessionDescription)
  exchange(data);
});
socket.on('leave', function(socketId){
  console.log('socket.on leave', socketId);
  leave(socketId);
});

socket.on('connect', function() {
  console.log('socket.on connect:', socket);
  getLocalStream();
});

function logError(error) {
  console.log("logError", error);
}

function press() {
  var roomID = document.getElementById('roomID').value;
  if (roomID == "") {
    alert('Please enter room ID');
  } else {
    var roomIDContainer = document.getElementById('roomIDContainer');
    roomIDContainer.parentElement.removeChild(roomIDContainer);
    join(roomID);
  }
}
function muteMicrophone (){
  localStream.getAudioTracks()[0].enabled ? (
    console.log("Mute microphone"),
    localStream.getAudioTracks()[0].enabled = false
  ) : (
    console.log("Unmute microphone"),
    localStream.getAudioTracks()[0].enabled = true
  )
}
function textRoomPress() {
  var text = document.getElementById('textRoomInput').value;
  if (text == "") {
    alert('Enter something');
  } else {
    document.getElementById('textRoomInput').value = '';
    var content = document.getElementById('textRoomContent');
    content.innerHTML = content.innerHTML + '<p>' + 'Me' + ': ' + text + '</p>';
    for (var key in pcPeers) {
      var pc = pcPeers[key];
      pc.textDataChannel.send(text);
    }
  }
}
