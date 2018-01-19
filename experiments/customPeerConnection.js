
// Custom RTCPeerConnection extends 
// Add Methods error to Logger & all ev handlers
// Get stats valores utiles



function RTCPeerConnectionLingbe(configuration) {
  var pc = new RTCPeerConnection(configuration);
  pc.onMessage = function(){
    return pc.onBlabLbalsaklsdjasd()
  }
  return pc;


}

RTCPeerConnection.prototipe.onLog = function(log){
  
  pc.onsignalingstatechange = function(event) {
    log({event:'onsignalingstatechange', payload:event});
  };
  
}

// override methods before "new"
// Uncaught TypeError: Illegal invocation
RTCPeerConnection.prototype.onicecandidate = function (event) {
  console.log('RTCPeerConnection.prototype.onicecandidate');
}

//////////// Logger: RTCPeerConnection.prototype.startLogger

function eventWrapper(eventName, extra){
  this[_+eventName] = this[eventName];
  this[eventName] = function (event) {
    const eventData = {
      {type: 'onsignalingstatechange'},
      ...event
    };
    if(extras) extras.forEach((extra) => {
      eventData.extra = this[extra];
    });
    _logDispatch(eventData);
    return this[eventName](event);
  }  
}


///////////////


function _getStats() {
  console.log('try to getStats');
  if (pc && pc.getRemoteStreams()[0] &&
      pc.getRemoteStreams()[0].getAudioTracks()[0]) {
    const track = pc.getRemoteStreams()[0].getAudioTracks()[0];
    console.log('getStats');
    pc.getStats(track, function(report) {
      console.log('getStats REMOTE report', report);
    }, logError);
  }
}