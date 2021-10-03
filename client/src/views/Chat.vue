<script setup lang="ts">
import Loader from "../components/Loader.vue";
import TypingPlaceholder from "../components/TypingPlaceholder.vue";
import { createToast } from "mosha-vue-toastify";
// import the styling for the toast
import "mosha-vue-toastify/dist/style.css";

import {
  onMounted,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from "@vue/runtime-core";
import { useRouter } from "vue-router";
import { Message } from "../@types";
import gState from "../store";
// import { iceConfig } from "../consts";

const router = useRouter();
const isMatched = ref<Boolean>(false);
const isStrangerTyping = ref(false);
const message = ref<string>("");
const messagesContainer = ref<HTMLDivElement>(null!);
const messages = ref<Message[]>([]);

let localStream: MediaStream;
let remoteStream: MediaStream = new MediaStream();

let pc: RTCPeerConnection;

const localVideoEl = ref<HTMLVideoElement>(null as any);
const remoteVideoEl = ref<HTMLVideoElement>(null as any);

let debounceTimeout: ReturnType<typeof setTimeout>;
let isTypingTimeout: ReturnType<typeof setTimeout>;

async function handleSend() {
  if (!message.value || !message.value.trim()) return;
  console.log("sending ", message.value);

  gState.IO.emit("message", message.value);
  gState.IO.emit("typing", false);

  messages.value.push({ content: message.value, isAuthor: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  message.value = "";
}
async function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
  console.log("gen candidate ", event.candidate);
  if (event.candidate) {
    gState.IO.emit("iceCandidate", event.candidate);
  }
}

async function handleIceStateChange(event: Event) {
  console.log("ICE state change event: ", event);
}

function handleConnectionStateChange() {
  const failedStates = ["disconnected", "failed", "closed"];
  console.log("states ", pc.connectionState);

  if (pc.connectionState === "connected") {
    createToast(pc.connectionState, { type: "success" });
  } else if (failedStates.includes(pc.connectionState)) {
    createToast(pc.connectionState, { type: "danger" });
  }
}
async function handleRemoteTrack(event: RTCTrackEvent) {
  console.log("pc2 received remote stream");
  console.log(event);
  remoteStream = event.streams[0];
  remoteVideoEl.value.srcObject = remoteStream;
  await remoteVideoEl.value.play();
}

async function handleMatchSuccess(initiatorId: string) {
  try {
    isMatched.value = true;
    pc.addEventListener("icecandidate", handleIceCandidate);
    pc.addEventListener("iceconnectionstatechange", handleIceStateChange);
    pc.addEventListener("connectionstatechange", handleConnectionStateChange);
    pc.addEventListener("track", handleRemoteTrack);
    if (initiatorId === gState.IO.id) {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      console.log(offer);
      await pc.setLocalDescription(offer);
      console.log("offer set as LD");
      gState.IO.emit("offer", offer);
    }
    createToast("trying to send the offer", { type: "info" });
  } catch (error) {
    createToast("failed to send the offer", { type: "danger" });
  }
}

watch(
  () => message.value,
  () => {
    console.log("mesage changed");
    if (!message.value || !message.value.trim()) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      gState.IO.emit && gState.IO.emit("typing", true);
      console.log("typiing emitted");
    }, 250);
  }
  // { immediate: true }
);
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function init() {
  isMatched.value = false;
  remoteStream = new MediaStream();
  messages.value = [];
  if (!gState.IO.id) {
    router.push("/");
    return;
  }
  pc = new RTCPeerConnection(configuration);

  gState.IO.off();
  pc.removeEventListener("icecandidate", handleIceCandidate);
  pc.removeEventListener("iceconnectionstatechange", handleIceStateChange);
  pc.removeEventListener("connectionstatechange", handleConnectionStateChange);
  pc.removeEventListener("track", handleRemoteTrack);
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

  gState.IO.on("matchSuccess", (id: string) => {
    handleMatchSuccess(id);
  });
  gState.IO.on("newMessage", async (newMessage: string) => {
    console.log("msg recieved", newMessage);
    isStrangerTyping.value = false;
    messages.value.push({ content: newMessage, isAuthor: false });
    await new Promise((resolve) => setTimeout(resolve, 100));
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  });
  gState.IO.on("typing", (typingState: boolean) => {
    isStrangerTyping.value = typingState;
    clearTimeout(isTypingTimeout);
    isTypingTimeout = setTimeout(() => {
      isStrangerTyping.value = false;
    }, 800);
  });
  gState.IO.on("newAnswer", async (newOffer: RTCSessionDescriptionInit) => {
    try {
      console.log("got new answer");
      const remoteDescription = new RTCSessionDescription(newOffer);
      await pc.setRemoteDescription(remoteDescription);
      console.log("description set from answer");
      createToast("recieved answer, trying to connect", { type: "info" });
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
  gState.IO.disconnect && gState.IO.disconnect();
});
</script>
<template>
  <section class="section-loader" v-if="!isMatched">
    <Loader /><small>trying to find you the right person...</small>
  </section>
  <section class="section-chat-dashboard" v-else>
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

      <div class="message-input">
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
      <div class="video-container local-video">
        <video ref="localVideoEl" muted autoplay playsinline></video>
      </div>
      <div class="video-container remote-video">
        <video ref="remoteVideoEl" autoplay playsinline></video>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
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
}

.section-video {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  // align-items: center;
  .video-container {
    max-height: 300px;
    max-width: 90%;
    margin: 0 auto;

    video {
      width: 100%;
      padding: 10px 0;
      height: 100%;
    }
  }
}
@media screen and (max-width: 450px) {
  .local-video {
    max-height: 300px !important;
    max-width: 200px !important;
  }
}

.section-messages {
  background: $secondary;
  width: 350px;
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

    .send-arrow {
      margin-left: 0.5rem;
      cursor: pointer;
      font-size: 1.75rem;
      color: white;
      background: $tertiary;
      padding: 0.5rem;

      border-radius: 50%;

      &:active i {
        transform: scale(0.8);
      }
    }
    input {
      color: $tertiary;
      font-size: 0.95rem;
      border-radius: 8px;
      width: 90%;
      background: $secondary;
      border: 2px solid white;
      padding: 0.6rem 0.75rem;
      outline: none;
      &:focus {
        outline: 0.5px solid white;
      }
      &::placeholder {
        color: white;
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
    color: white;
  }
  &.author {
    margin: 1.4rem 0 1.4rem 2rem;
    justify-content: flex-end;
    .message__content {
      background: white;
      color: $tertiary;
    }
  }
}

@media screen and (max-width: 640px) {
  .section-chat-dashboard {
    flex-direction: column-reverse;
    .section-messages {
      width: 100%;
      overflow-y: auto;
      .message-input {
        margin: 1rem 0;
      }
    }
  }
}
</style>
