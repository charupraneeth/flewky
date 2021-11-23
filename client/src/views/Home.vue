<script setup lang="ts">
import { onMounted, ref } from "@vue/runtime-core";
import { io, Socket } from "socket.io-client";
import { useRouter } from "vue-router";
import gState from "../store/index";
import { createToast } from "mosha-vue-toastify";
import "mosha-vue-toastify/dist/style.css";

import Loader from "../components/Loader.vue";
import Navbar from "../components/Navbar.vue";
import { Jiglag } from "../@types";
import Footer from "../components/Footer.vue";

const router = useRouter();
const loading = ref(true);
const token = ref("");

const isGoDisabled = ref(false);

function handleSignout() {
  gState.IO.disconnect && gState.IO.disconnect();
  localStorage.clear();
  createToast("signed out", { type: "info" });
  router.push("/login");
}

async function handleConnect() {
  isGoDisabled.value = true;
  if (!token.value) {
    router.push("/login");
  }

  try {
    gState.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (!gState.localStream || !gState.localStream?.active) {
      createToast("video and audio is required", { type: "info" });
      return;
    }

    const ioObject: Socket = io(import.meta.env.VITE_SERVER_URL, {
      transports: ["websocket"],
      auth: {
        token: token.value,
      },
    });
    gState.IO = ioObject;

    gState.IO.on("connect", () => {
      console.log("connected");

      loading.value = false;
      router.push("/app");
    });

    gState.IO.on("connect_error", (err) => {
      console.log("connect_error ", err);
      gState.IO.disconnect();
      if (gState.localStream && gState.localStream.active) {
        gState.localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
      gState.localStream = null;

      if (err.message.includes("jwt")) {
        createToast("session expired, login again", { type: "warning" });
        localStorage.clear();
        console.log("pushing");
        gState.IO = {} as any;
        ioObject.disconnect && ioObject.disconnect();
        console.log("dis");
        router.push("/login");
        return;
      }
      createToast(err.message || "failed to establish socket connection", {
        type: "danger",
      });
      isGoDisabled.value = false;
    });
  } catch (error: any) {
    isGoDisabled.value = false;
    console.log(error);
    if (
      error?.message.includes(
        "The request is not allowed by the user agent or the platform in the current context"
      )
    ) {
      createToast("please enable audio and video", { type: "warning" });
    }
    createToast(error.message || "failed to connect socket", {
      type: "warning",
    });
    // actionReset();
    gState.IO.disconnect && gState.IO.disconnect();
  }
}

onMounted(() => {
  loading.value = true;
  const jiglag = localStorage.getItem("jiglag");
  if (!jiglag) {
    router.push("/login");
    return;
  }
  const { email, token: prevToken } = JSON.parse(jiglag) as Jiglag;

  if (!token || !email || !prevToken.trim() || !email.trim()) {
    loading.value = false;
    router.push("/login");
    return;
  } else {
    token.value = prevToken;
    loading.value = false;
    // handleConnect();
  }
});
</script>
<template>
  <section class="loader-section" v-if="loading">
    <Loader />
  </section>
  <div class="home-container" v-else>
    <navbar>
      <button class="btn" @click="handleSignout">
        sign out <i class="fas fa-sign-out-alt"></i>
      </button>
    </navbar>
    <section>
      <div class="section-intro">
        <div class="headline">
          <h1>Strangers are just friends waiting to happen</h1>
        </div>
        <div class="call-to-action">
          <h3 class="call-to-action__label">Click below</h3>

          <div class="call-to-action__buttons">
            <button
              class="btn call-to-action__button btn-secondary"
              @click="handleConnect"
              :disabled="isGoDisabled"
            >
              Go
            </button>
          </div>
        </div>
      </div>
      <div class="section-illustration">
        <img src="../assets/conversation_illustration.svg" alt="" />
      </div>
    </section>
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.loader-section {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.logo {
  font-weight: bold;
  text-decoration: none;
  color: $secondary;
  font-size: 2rem;
}

section {
  text-align: center;
  display: flex;
}

.section-illustration {
  width: 100%;
  img {
    width: 100%;
    height: auto;
  }
}
.headline {
  margin: 3rem 0;
  h1 {
    font-weight: 500 !important;
    text-align: left;
  }
}

.call-to-action__label {
  text-align: left;
  color: $secondary;
  font-weight: bold;
  font-size: 1.5rem;
}
.call-to-action__buttons {
  margin-top: 1rem;
  text-align: left;
  // display: flex;
  // justify-content: center;
}
.call-to-action__button {
  margin-top: 1rem;
  font-weight: bold;
  font-size: 1rem;
  // margin-right: 1rem;
  padding: 0.8rem 4rem;
}

@media screen and (max-width: 640px) {
  .home-container {
    padding: 0 1rem;
  }
  section {
    flex-direction: column-reverse;
  }
  .section-illustration {
    margin-top: 0;
  }
  .headline {
    margin: 3rem 0;
  }
}
</style>
