
function RTCPeerConnectionLogger(configuration) {
  var logListeners  = [];
  
  RTCPeerConnection.prototype.subscribeLogger = function(listener) {
    if (typeof listener !== 'function')
      throw new Error('Expected listener to be a function.');
      
    logListeners.push(listener);
    return function unsubscribe() {
      // two objects are equal if they refer to the exact same object
      const index = logListeners.indexOf(listener);
      logListeners.splice(index, 1);
    };
	}
  
  // Bind methods with _logDispatch
  RTCPeerConnection.prototype.startLogger = function(instanceData) {
    const pc = this;
    // if (typeof pc !== 'object')
    //   throw new Error('Expected peerConnectiontener in instanceData');
      
    function _logDispatch (log){
      // log.payload.socketId = instanceData.socketId;
      logListeners.slice().forEach(listener => listener(log));
    }
    _logDispatch({ type : 'startLogger', payload: instanceData });
    
    if (instanceData.getStats) {
      // console.log('try to setInterval getStats');
      // setInterval(_getStats, 1000);
    }
    
    // TODO duplicated code: methods have the same logic
    
    const _onicecandidate = pc.onicecandidate;
    pc.onicecandidate = function (event) {
      _logDispatch({
        type    : 'onicecandidate',
        payload : { 
          candidate : event.candidate,
          event     : event 
        }
      });
      return _onicecandidate(event);
    }
    
    const _onnegotiationneeded = pc.onnegotiationneeded;
    pc.onnegotiationneeded = function (event) {
      _logDispatch({
        type    : 'onnegotiationneeded',
        payload : { 
          isOffer : instanceData.isOffer,
          event   : event 
        }
      });
      return _onnegotiationneeded();
    }
    
    const _oniceconnectionstatechange = pc.oniceconnectionstatechange;
    pc.oniceconnectionstatechange = function (event) {
      _logDispatch({
        type    : 'oniceconnectionstatechange',
        payload : { 
          iceConnectionState : pc.iceConnectionState,
          event              : event 
        }  
      });
      return _oniceconnectionstatechange(event);
    }
    
    const _onsignalingstatechange = pc.onsignalingstatechange;
    pc.onsignalingstatechange = function (event) {
      _logDispatch({
        type: 'onsignalingstatechange',
        payload: { 
          signalingState : pc.signalingState,
          event          : event 
        } 
      });
      return _onsignalingstatechange(event);
    }
    
    const _onaddstream = pc.onaddstream;
    pc.onaddstream = function (event) {
      _logDispatch({
        type: 'onaddstream',
        payload: { 
          stream : event.stream,
          event  : event 
        } 
      });
      return _onaddstream(event);
    }
    
	}
  
  // const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
  return new RTCPeerConnection(configuration);
}
