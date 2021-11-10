<script setup lang="ts">
import Loader from "../components/Loader.vue";
import LoaderVideo from "../components/LoaderVideo.vue";
import TypingPlaceholder from "../components/TypingPlaceholder.vue";
import { createToast } from "mosha-vue-toastify";
// import the styling for the toast
import "mosha-vue-toastify/dist/style.css";

import { onMounted, onUnmounted, ref, watchEffect } from "@vue/runtime-core";
import { useRouter } from "vue-router";
import { Message, Positions } from "../@types";
import gState from "../store";
import Report from "../components/Report.vue";
// import { iceConfig } from "../consts";
const audioUrl = new URL("../assets/success.mp3", import.meta.url).href;
// console.log(audioUrl);

const router = useRouter();
const isMatched = ref<Boolean>(false);
const isStrangerTyping = ref(false);
const message = ref<string>("");
const messagesContainer = ref<HTMLDivElement>(null!);
const messages = ref<Message[]>([]);
const strangerCollege = ref("");

const isDataChannelOpen = ref(false);
const remoteVideoLoaded = ref(false);

let localStream: MediaStream;
let remoteStream: MediaStream = new MediaStream();

let pc: RTCPeerConnection;
let datachannel: RTCDataChannel | null;

let remoteVideoTimer = null as any;

const localVideoEl = ref<HTMLVideoElement>(null as any);
const remoteVideoEl = ref<HTMLVideoElement>(null as any);

// let isTypingTimeout: ReturnType<typeof setTimeout>;

const positions: Positions = {
  clientX: undefined,
  clientY: undefined,
  movementX: 0,
  movementY: 0,
};

function elementDrag(event: MouseEvent) {
  event.preventDefault();
  if (!positions.clientX || !positions.clientY) return;
  positions.movementX = positions.clientX - event.clientX;
  positions.movementY = positions.clientY - event.clientY;
  positions.clientX = event.clientX;
  positions.clientY = event.clientY;
  // set the element's new position:
  // console.log(
  //   localVideoEl.value.offsetLeft - positions.movementX,
  //   localVideoEl.value.offsetTop - positions.movementY
  // );
  const top = localVideoEl.value.offsetTop - positions.movementY;
  const left = localVideoEl.value.offsetLeft - positions.movementX;
  const parent = localVideoEl.value.parentElement;
  if (!parent) return;
  if (top < 5 || top > parent?.offsetHeight - localVideoEl.value.offsetHeight)
    return;
  if (left < 5 || left > parent?.offsetWidth - localVideoEl.value.offsetWidth)
    return;
  localVideoEl.value.style.top = top + "px";
  localVideoEl.value.style.left = left + "px";
}

function closeDragElement() {
  document.onmouseup = null;
  document.onmousemove = null;
}

function dragMouseDown(event: MouseEvent) {
  event.preventDefault();
  // get the mouse cursor position at startup:
  positions.clientX = event.clientX;
  positions.clientY = event.clientY;
  document.onmousemove = elementDrag;
  document.onmouseup = closeDragElement;
}

async function handleRemoteVideoLoad() {
  // await document.querySelector("audio")?.play();
  remoteVideoLoaded.value = true;
}
function handleChannelOpen() {
  console.log("channel open");
  isDataChannelOpen.value = true;
}
function handleChannelClose() {
  console.log("channel close");
}
function handleChannelError() {
  console.log("channel error");
  createToast("error in data channel", { type: "warning" });
  isDataChannelOpen.value = false;
}

async function handleNewMessage(messageEvent: MessageEvent) {
  console.log("message evnet ", messageEvent);

  const newMessage = messageEvent.data;
  console.log("msg recieved", newMessage);
  isStrangerTyping.value = false;
  messages.value.push({ content: newMessage, isAuthor: false });
  await new Promise((resolve) => setTimeout(resolve, 100));
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
}

async function handleSend() {
  if (!message.value || !message.value.trim()) return;
  console.log(message.value.length);

  if (message.value.length > 256) {
    createToast("message can have a max 256 of characters only", {
      type: "warning",
    });
    message.value = "";
    return;
  }

  if (datachannel?.readyState == "open") {
    datachannel.send(message.value);
    messages.value.push({ content: message.value, isAuthor: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  } else {
    console.log("channel not found");
    createToast("channel not found", { type: "warning" });
  }
  console.log("sending ", message.value);

  message.value = "";
}

async function handleEndCall() {
  gState.IO.emit("endCall");
  await init();
}

async function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
  // console.log("gen candidate ", event.candidate);
  if (event.candidate) {
    gState.IO.emit("iceCandidate", event.candidate);
  }
}

async function handleIceStateChange(event: Event) {
  // console.log("ICE state change event: ", event);
}

function handleConnectionStateChange() {
  const failedStates = ["disconnected", "failed", "closed"];
  console.log("states ", pc.connectionState);

  if (pc.connectionState === "connected") {
    createToast(pc.connectionState, { type: "success" });
  } else if (failedStates.includes(pc.connectionState)) {
    createToast(pc.connectionState, { type: "danger" });
    handleEndCall();
  }
}
async function handleRemoteTrack(event: RTCTrackEvent) {
  console.log("pc2 received remote stream");
  // console.log(event);
  remoteStream = event.streams[0];
  remoteVideoEl.value.srcObject = remoteStream;
  // await remoteVideoEl.value.play();
}

async function handleMatchSuccess(chatMetaData: any) {
  try {
    remoteVideoTimer = setTimeout(async () => {
      if (!remoteVideoLoaded.value) {
        console.log("no remote video found");
        await handleEndCall();
      } else {
        console.log("remote video loaded");
      }
    }, 20000);
    // console.log("metadata ", chatMetaData);

    isMatched.value = true;
    strangerCollege.value = chatMetaData?.strangerCollege;
    pc.addEventListener("icecandidate", handleIceCandidate);
    pc.addEventListener("iceconnectionstatechange", handleIceStateChange);
    pc.addEventListener("connectionstatechange", handleConnectionStateChange);
    pc.addEventListener("track", handleRemoteTrack);
    if (chatMetaData.isHost) {
      datachannel = pc.createDataChannel("textChannel");
      datachannel.addEventListener("open", handleChannelOpen);
      datachannel.addEventListener("close", handleChannelClose);
      datachannel.addEventListener("error", handleChannelError);
      datachannel.addEventListener("message", handleNewMessage);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      // console.log(offer);
      await pc.setLocalDescription(offer);
      // console.log("offer set as LD");
      gState.IO.emit("offer", offer);
    } else {
      pc.addEventListener("datachannel", (channelEvent) => {
        datachannel = channelEvent.channel;
        datachannel.addEventListener("open", handleChannelOpen);
        datachannel.addEventListener("close", handleChannelClose);
        datachannel.addEventListener("error", handleChannelError);
        datachannel.addEventListener("message", handleNewMessage);
      });
    }

    // createToast("trying to send the offer", { type: "info" });
  } catch (error) {
    createToast("failed to send the offer", { type: "danger" });
  }
}

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:numb.viagenie.ca",
      username: "vimrrembmvebxcunca@sdvgeft.com",
      credential: "LbPCDcA9aub6sPV",
    },
    {
      urls: "turn:numb.viagenie.ca",
      username: "webrtc@live.com",
      credential: "muazkh",
    },
  ],
};

async function init() {
  if (pc) {
    pc.removeEventListener("icecandidate", handleIceCandidate);
    pc.removeEventListener("iceconnectionstatechange", handleIceStateChange);
    pc.removeEventListener(
      "connectionstatechange",
      handleConnectionStateChange
    );
    pc.removeEventListener("track", handleRemoteTrack);
    pc.close();
  }
  datachannel = null;
  isDataChannelOpen.value = false;

  clearInterval(remoteVideoTimer);
  console.log("is matched ", isMatched.value);
  isMatched.value = false;
  remoteStream = new MediaStream();
  messages.value = [];
  message.value = "";
  remoteVideoLoaded.value = false;
  if (!gState.IO.id) {
    router.push("/");
    return;
  }
  pc = new RTCPeerConnection(configuration);

  gState.IO.off();

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        console.log("local track ended");
        createToast("local video ended/disabled", { type: "danger" });
        router.push("/");
      });
      pc.addTrack(track, localStream);
    });
  } catch (error) {
    createToast("video is required", { type: "danger" });
    console.log(error);
    router.push("/");
    return;
  }
  gState.IO.emit("connectNewUser");

  gState.IO.on("matchSuccess", (chatMetaData: any) => {
    handleMatchSuccess(chatMetaData);
  });
  // gState.IO.on("newMessage", async (newMessage: string) => {
  //   console.log("msg recieved", newMessage);
  //   isStrangerTyping.value = false;
  //   messages.value.push({ content: newMessage, isAuthor: false });
  //   await new Promise((resolve) => setTimeout(resolve, 100));
  //   messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  // });
  // gState.IO.on("typing", (typingState: boolean) => {
  //   isStrangerTyping.value = typingState;
  //   clearTimeout(isTypingTimeout);
  //   isTypingTimeout = setTimeout(() => {
  //     isStrangerTyping.value = false;
  //   }, 800);
  // });
  gState.IO.on("newAnswer", async (newOffer: RTCSessionDescriptionInit) => {
    try {
      console.log("got new answer");
      const remoteDescription = new RTCSessionDescription(newOffer);
      await pc.setRemoteDescription(remoteDescription);
      console.log("description set from answer");
      // createToast("recieved answer, trying to connect", { type: "info" });
    } catch (error) {
      console.log("err", error);
      createToast("failed to set answer", { type: "danger" });
      init();
    }
  });

  gState.IO.on("newOffer", async (newOffer: RTCSessionDescriptionInit) => {
    try {
      console.log("got new offer");
      await pc.setRemoteDescription(new RTCSessionDescription(newOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("description set from offer");
      gState.IO.emit("answer", answer);
      console.log("emitted answer");
      // createToast("got an offer, sending reply", { type: "info" });
    } catch (error) {
      createToast("failed to accept offer", { type: "danger" });
      console.log("newOfferError", error);
      init();
    }
  });
  gState.IO.on("newIceCandidate", async (newIceCandidate) => {
    try {
      console.log("got candidate from remote");
      await pc.addIceCandidate(newIceCandidate);
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  });

  gState.IO.on("strangerDisconnected", () => {
    createToast("stanger disconnected", { type: "danger" });
    // reconnect
    init();
  });

  gState.IO.on("ban", () => {
    createToast("you have been banned for inappropritate activity", {
      type: "danger",
    }),
      router.push("/");
  });

  watchEffect(async () => {
    if (localVideoEl.value) {
      localVideoEl.value.srcObject = localStream;
      localVideoEl.value.volume = 0;
      // await localVideoEl.value.play();
      console.log("local played");
    }
    if (remoteVideoEl.value) {
      remoteVideoEl.value.srcObject = remoteStream;
      // await remoteVideoEl.value.play();
      console.log("remote played");
    }
    console.log("estate ", pc.signalingState);
  });
}

onMounted(async () => {
  if (!gState.IO.id) {
    router.push("/");
    return;
  }

  console.log("not matched");

  init();
});

onUnmounted(() => {
  if (localStream) {
    localStream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
  if (pc) pc.close();
  gState.IO.disconnect && gState.IO.disconnect();
  console.log("this con");
});
</script>
<template>
  <section class="section-loader" v-if="!isMatched">
    <Loader /><small>trying to find you the right person...</small>
  </section>
  <section class="section-chat-dashboard" v-else>
    <Report v-if="remoteVideoLoaded" />
    <div class="section-messages">
      <div class="messages-container" ref="messagesContainer">
        <p class="message-placeholder" v-if="!messages.length">
          You're now chatting with a random stranger
        </p>
        <div
          class="message"
          :class="{ author: message.isAuthor }"
          v-for="(message, index) in messages"
          :key="index"
        >
          <div class="message__content">
            {{ message.content }}
          </div>
        </div>
        <typing-placeholder v-if="isStrangerTyping" />
      </div>

      <div class="message-input" :disabled="isDataChannelOpen">
        <span class="phone-icon" @click="handleEndCall">
          <i class="fa fa-phone" aria-hidden="true"></i>
        </span>
        <input
          type="text"
          v-model="message"
          @keyup.enter="handleSend"
          placeholder="Message..."
        />
        <span class="send-arrow" @click="handleSend"
          ><i class="far fa-paper-plane"></i
        ></span>
        <!-- <button @click="handleSend">send</button> -->
      </div>
    </div>

    <div class="section-video">
      <video
        class="local-video"
        ref="localVideoEl"
        muted
        autoplay
        playsinline
        @mousedown="dragMouseDown"
      >
        waiting for your video
      </video>

      <LoaderVideo v-if="!remoteVideoLoaded" />
      <span class="stranger-college" v-if="remoteVideoLoaded">{{
        strangerCollege
      }}</span>
      <div class="remote-video-wrap" v-show="remoteVideoLoaded">
        <audio :src="audioUrl">this is audio</audio>
        <video
          class="remote-video"
          ref="remoteVideoEl"
          autoplay
          playsinline
          @loadeddata="handleRemoteVideoLoad"
        ></video>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.section-loader {
  height: 100%;
  color: $tertiary;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.section-chat-dashboard {
  height: 100%;
  display: flex;
  position: relative;
}

.section-video {
  background: rgb(210, 224, 231);
  overflow-y: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  justify-content: center;

  .stranger-college {
    display: inline-block;
    text-align: center;
  }
  .remote-video-wrap {
    text-align: center;
    max-height: 100%;
    width: 100%;
    position: relative;
    &::after {
      content: "flewky";
      position: absolute;
      top: 95%;
      left: 12%;
      opacity: 0.4;
    }

    // padding: 1rem;
    .remote-video {
      width: 80%;
      display: inline-block;
      max-width: 100%;
      height: auto;
      border-radius: 10px;
    }
  }
  .local-video {
    cursor: move;
    position: absolute;
    bottom: 15px;
    right: 10px;
    z-index: 1;
    max-width: 150px;
    border-radius: 10px;
  }
}

.section-messages {
  background: $primary;
  width: 700px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .messages-container {
    overflow-y: auto;
    scroll-behavior: smooth;
    scrollbar-color: light;
    scrollbar-width: thin;
  }
  .message-input {
    margin-bottom: 0.5rem;
    text-align: center;
    display: flex;
    padding: 0.5rem;
    .phone-icon {
      cursor: pointer;
      border-radius: 50%;
      padding: 1rem;
      margin-right: 0.5rem;

      color: white;

      background: red;
      i {
        transform: rotate(225deg);
      }
      &:active i {
        transform: rotate(225deg) scale(0.8);
      }
    }

    .send-arrow {
      margin-left: 0.5rem;
      cursor: pointer;
      color: white;
      background: $tertiary;
      padding: 1rem;

      border-radius: 50%;

      &:active i {
        transform: scale(0.8);
      }
    }
    input {
      color: $primary;
      font-size: 0.95rem;
      border-radius: 8px;
      width: 90%;
      background: $secondary;
      border: 2px solid $secondary;
      padding: 0.6rem 0.75rem;
      outline: none;
      &:focus {
        outline: 0.5px solid $primary;
      }
      &::placeholder {
        color: $primary;
        font-weight: bold;
      }
    }
  }
}
.message-placeholder {
  padding: 1rem;
}
.message {
  display: flex;
  justify-content: flex-start;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  margin: 1.4rem 2rem 1.4rem 0rem;

  .message__content {
    line-height: 1.25rem;
    word-spacing: 0.1rem;
    letter-spacing: 0.0125rem;
    border-radius: 12px;
    margin: 0 1rem;
    padding: 0.4rem 0.8rem;
    background: $tertiary;
    color: $primary;
  }
  &.author {
    margin: 1.4rem 0 1.4rem 2rem;
    justify-content: flex-end;
    .message__content {
      background: $secondary;
      color: $primary;
    }
  }
}

@media screen and (max-width: 640px) {
  .section-chat-dashboard {
    flex-direction: column-reverse;
    .section-messages {
      max-height: 220px;
      width: 100%;
      overflow-y: auto;
      .message-input {
        margin: 1rem 0;
      }
    }
  }
  .remote-video-wrap::after {
    content: "flewky";
    position: absolute;
    top: 92% !important;
    left: 6% !important;
    opacity: 0.4;
  }
  .remote-video {
    padding: 0rem;
    min-width: 95%;
  }
  .local-video {
    width: max-content;
    min-width: 100px;
    max-width: 100px !important;
  }
}
</style>
