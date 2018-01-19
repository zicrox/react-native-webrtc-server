
function RTCPeerConnectionLogger2(configuration) {
  // const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
  var pc = new RTCPeerConnection(configuration);
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
  
  
  RTCPeerConnection.prototype.startLogger = function() {
    console.log('this', this);
    // if (typeof this.oniceconnectionstatechange !== 'function')
    //   console.error('Expected oniceconnectionstatechange to be a function');
      
    function _logDispatch (log){
      logListeners.slice().forEach(listener => listener(log));
    }
    
    // TODO extras
    function _eventWrapper(eventName, extra){
      if(this[eventName] === null) 
        console.warn(eventName+' event handler is null');
      // this['_'+eventName] = this[eventName];
      const tempRef = this[eventName];
      this[eventName] = function (event) {
        const eventData = { type: event.type };
        // if(extras) extras.forEach((extra) => {
        //   eventData.extra = this[extra];
        // });
        _logDispatch(eventData);
        // return this['_'+eventName](event);
        return tempRef(event);
      }  
    }
    
    const eventHandlersNames = [
      'onicecandidate',
      'onnegotiationneeded',
      'oniceconnectionstatechange',
      'onsignalingstatechange',
      'onaddstream'
    ]
    eventHandlersNames.forEach((eventName) => {
      _eventWrapper.bind(this)(eventName);
    });
    
  }
  
  return pc;
}
