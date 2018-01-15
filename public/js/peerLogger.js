
function RTCPeerConnectionLogger() {
  var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
  var logListeners = [];
  
  RTCPeerConnection.prototype.subscribeLogger = function(listener){
    if (typeof listener !== 'function')
      throw new Error('Expected listener to be a function.');
      
    logListeners.push(listener);
    return function unsubscribe() {
      // two objects are equal if they refer to the exact same object
      var index = logListeners.indexOf(listener);
      logListeners.splice(index, 1);
    };
	}
  
  // Bind methods with _logDispatch
  RTCPeerConnection.prototype.startLogger = function(pc){
    function _logDispatch (log){
      logListeners.slice().forEach(listener => listener(log));
    }
    
    const _onicecandidate = pc.onicecandidate;
    pc.onicecandidate = function (event) {
      _logDispatch({ event:'onicecandidate', payload: event });
      return _onicecandidate(event);
    }
	}
  return RTCPeerConnection;
}