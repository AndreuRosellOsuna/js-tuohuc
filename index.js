// Import stylesheets
import "./style.css";

// Roles
let role;

// Buttons
const initButtons = () => {
  document.getElementById("create-offer").addEventListener("click", () => {
    role = "caller";
    createDataChannel();
    createOffer();
  });

  document.getElementById("set-offer-button").addEventListener("click", () => {
    const offerValue = document.getElementById("offer").value;
    if (offerValue) {
      receiveDataChannel();
      replyToOffer(offerValue);
    }
  });

  document.getElementById("create-answer").addEventListener("click", () => {
    role = "recipient";
    createAnswer();
  });

  document.getElementById("set-answer-button").addEventListener("click", () => {
    const answerValue = document.getElementById("answer").value;
    if (answerValue) {
      replyToAnswer(answerValue);
    }
  });

  document
    .getElementById("send-message-button")
    .addEventListener("click", () => {
      const inputMessage = document.getElementById("send-message-input");
      const message = inputMessage.value;
      dataChannel.send(message);
      addMessage(message);
      inputMessage.value = "";
    });
};

// Configuration
const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
    }
  ],
  iceCandidatePoolSize: 10
};

// Caller
const createDataChannel = () => {
  dataChannel = peerConnection.createDataChannel("textChannel");

  dataChannel.onopen = event => console.log(event);
  dataChannel.onclose = event => console.log(event);
  dataChannel.onmessage = onMessageFromChannel;
};

const createOffer = async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  // Aqui no vale pillar la offer, todavía no está completa
  // document.getElementById("offer").value = JSON.stringify(
  //   peerConnection.localDescription
  // );
};

const replyToAnswer = async answer => {
  const answerObject = JSON.parse(answer);
  const remoteSessionDescription = new RTCSessionDescription(answerObject);
  await peerConnection.setRemoteDescription(remoteSessionDescription);
};

// Recipient
const receiveDataChannel = () => {
  peerConnection.ondatachannel = event => {
    dataChannel = event.channel;

    dataChannel.onmessage = event => console.log(event);
    dataChannel.onopen = event => console.log(event);
    dataChannel.onclose = event => console.log(event);
    dataChannel.onmessage = onMessageFromChannel;
  };
};

const replyToOffer = async offer => {
  const offerObject = JSON.parse(offer);
  const remoteSessionDescription = new RTCSessionDescription(offerObject);
  await peerConnection.setRemoteDescription(remoteSessionDescription);
};

const createAnswer = async () => {
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  // document.getElementById("answer").value = JSON.stringify(
  //   peerConnection.localDescription
  // );
};

// Shared
const onMessageFromChannel = event => {
  const message = event.data;
  addMessage(message);
};

const addMessage = message => {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.textContent += "\n" + message;
};

function registerPeerConnectionListeners() {
  peerConnection.addEventListener("icegatheringstatechange", () => {
    console.log(
      `ICE gathering state changed: ${peerConnection.iceGatheringState}`
    );
  });

  peerConnection.onconnectionstatechange = () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  };

  peerConnection.addEventListener("signalingstatechange", () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener("iceconnectionstatechange ", () => {
    console.log(
      `ICE connection state change: ${peerConnection.iceConnectionState}`
    );
  });

  peerConnection.onicecandidate = event => {
    if (role == "caller") {
      document.getElementById("offer").value = JSON.stringify(
        peerConnection.localDescription
      );
    } else if (role == "recipient") {
      document.getElementById("answer").value = JSON.stringify(
        peerConnection.localDescription
      );
    } else {
      console.error("error in role");
    }
    console.log(
      `this is the local descripcion with the ice candidate: ${JSON.stringify(
        peerConnection.localDescription
      )}`
    );
  };
}

const requestMediaGrants = () => {
  const constraints = {
    video: true,
    audio: true
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
      const localVideo = document.getElementById("localVideo");
      localVideo.srcObject = stream;
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    })
    .catch(error => console.error("permission denied"));
};

// Init
initButtons();
const peerConnection = new RTCPeerConnection(configuration);
let dataChannel;
registerPeerConnectionListeners();
requestMediaGrants();

const remoteStream = new MediaStream();
const remoteVideo = document.getElementById("remoteVideo");
remoteVideo.srcObject = remoteStream;
peerConnection.ontrack = event => {
  remoteStream.addTrack(event.track, remoteStream);
};
