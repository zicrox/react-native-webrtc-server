
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