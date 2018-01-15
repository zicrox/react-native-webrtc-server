// Buttons functions
function pressToJoin() {
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

function renderConnectionStatus (event){
  // Render target status
  function _render(status){
    document.querySelector('#textRoomContent span').innerHTML = "Connection status: "+status
  }
  // Status to render
  var status = event.target.iceConnectionState;
  if (status === 'checking' || status === 'connected' || 
      status === 'disconnected' || status === 'failed') {
    _render(status);
  }
}