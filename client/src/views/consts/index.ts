export const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
};

export const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // { urls: "stun:stun2.l.google.com:19302" },
    // { urls: "stun:stun3.l.google.com:19302" },
    // { urls: "stun:stun4.l.google.com:19302" },
  ],
};
