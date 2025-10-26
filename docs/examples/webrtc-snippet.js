
const roomId = "ap-<APPOINTMENT_ID>";
const peerId = crypto.randomUUID(); // or user id
const token = "<ACCESS_TOKEN>"; // JWT from login

const ws = new WebSocket(`wss://your-backend.example.com/ws?token=${token}&room=${roomId}&peer=${peerId}`);

ws.onmessage = async (ev) => {
  const msg = JSON.parse(ev.data);
  switch(msg.type) {
    case 'peer-joined':
      // optionally create an offer if you want to be caller
      break;
    case 'offer':
      await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({type:'answer', to: msg.from, payload: pc.localDescription}));
      break;
    case 'answer':
      await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
      break;
    case 'candidate':
      try { await pc.addIceCandidate(msg.payload); } catch(e) {}
      break;
    case 'peer-left':
      // handle hangup/cleanup
      break;
  }
};

ws.onopen = () => console.log("ws open");

const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // TURN servers added by backend or as config
  ]
});

pc.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({type:'candidate', to: remotePeerId, payload: event.candidate}));
  }
};

pc.ontrack = (evt) => {
  document.getElementById('remoteVideo').srcObject = evt.streams[0];
};

async function startLocalStream() {
  const stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true});
  stream.getTracks().forEach(t => pc.addTrack(t, stream));
  document.getElementById('localVideo').srcObject = stream;
}

async function createOfferAndSend(toPeerId) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({type:'offer', to: toPeerId, payload: pc.localDescription}));
}
