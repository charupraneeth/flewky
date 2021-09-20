<script setup lang="ts">
import Loader from "../components/Loader.vue";
import TypingPlaceholder from "../components/TypingPlaceholder.vue";

import { onMounted, onUnmounted, ref, watch } from "@vue/runtime-core";
import { useRouter } from "vue-router";
import { Message } from "../@types";
import gState from "../store";

const router = useRouter();
const isMatched = ref<Boolean>(false);
const isStrangerTyping = ref(false);
const message = ref<string>("");
const messagesContainer = ref<HTMLDivElement>(null!);
const messages = ref<Message[]>([]);

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

onMounted(() => {
  if (!gState.IO.id) {
    router.push("/");
    return;
  }
  gState.IO.emit("connectNewUser");
  gState.IO.on("matchSuccess", () => {
    isMatched.value = true;
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

    <div class="section-video"></div>
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
.section-messages {
  background: $secondary;
  width: 350px;
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
