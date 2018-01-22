
function RTCPeerConnectionLogger2(configuration) {
  // const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
  const pc = new RTCPeerConnection(configuration);
  const logListeners  = [];
  const eventHandlersNames = [
    'onicecandidate',
    'onnegotiationneeded',
    'oniceconnectionstatechange',
    'onsignalingstatechange',
    'onaddstream'
  ];
  const methodsNames = [
    'addStream',
    'createOffer',
    'setLocalDescription',
    'setRemoteDescription',
    'createAnswer',
    'setLocalDescription',
    'addIceCandidate',
    'close'
  ];
  
  function _logDispatch (log){
    logListeners.slice().forEach(listener => listener(log));
  }
  
  function _methodWrapper(methodName) {
    if (typeof pc[methodName] !== 'function'){
      console.error('Expected RTCPeerConnection method '+methodName+' to be a function.');
      return;
    }
    const tempRef = pc[methodName];
    pc[methodName] = function() {
      _logDispatch({ type: 'method', name: methodName });
      try {
        tempRef.apply(this, arguments);
      } catch (error) {
        _logDispatch({ type: 'method', name: methodName, error: error });
      }
    }
  }
  
  methodsNames.forEach((methodName) => {
    _methodWrapper(methodName);
  });
  
  RTCPeerConnection.prototype.startEventHandlersLogger = function() {
    // TODO extras
    function eventWrapper(eventName, extra) {
      if(this[eventName] === null) 
        console.warn(eventName+' event handler is null');
      // this['_'+eventName] = this[eventName];
      const tempRef = this[eventName];
      this[eventName] = function (event) {
        const eventData = { type: 'event', name: event.type };
        // if(extras) extras.forEach((extra) => {
        //   eventData.extra = this[extra];
        // });
        _logDispatch(eventData);
        // return this['_'+eventName](event);
        if(tempRef !== null)
           return tempRef(event);
      }
    }
    
    eventHandlersNames.forEach((eventName) => {
      eventWrapper.call(this, eventName);
    });
  }
  
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
  
  return pc;
}
