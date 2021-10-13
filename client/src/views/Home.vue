<script setup lang="ts">
import { onMounted, ref } from "@vue/runtime-core";
import { io, Socket } from "socket.io-client";
import { useRouter } from "vue-router";
import gState from "../store/index";
import { createToast } from "mosha-vue-toastify";
import "mosha-vue-toastify/dist/style.css";
import Loader from "../components/Loader.vue";
import { Jiglag } from "../@types";

const router = useRouter();
const loading = ref(true);
const token = ref("");

function handleConnect() {
  try {
    if (!token.value) {
      router.push("/login");
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
      if (err.message.includes("jwt")) {
        createToast("prev token expired, login again", { type: "warning" });
        localStorage.clear();
        console.log("pushing");
        gState.IO = {} as any;
        router.push("/login");
        gState.IO.disconnect && gState.IO.disconnect();
        return;
      }
    });
  } catch (error: any) {
    console.log(error);
    createToast(error.message || "failed to connect socket", {
      type: "warning",
    });
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
    <main>
      <nav>
        <router-link class="logo" to="/">Flewky</router-link>
      </nav>
      <section>
        <div class="section-intro">
          <div class="headline">
            <h1>From strangers to friends the journey just got easy</h1>
          </div>
          <div class="call-to-action">
            <h3 class="call-to-action__label">Click below</h3>
            <div class="call-to-action__buttons">
              <button
                class="btn call-to-action__button btn-secondary"
                @click="handleConnect"
              >
                go
              </button>
              <!-- <button
              class="btn call-to-action__button btn-primary"
              @click="handleConnect"
            >
              Text
            </button> -->
            </div>
          </div>
        </div>
        <div class="section-illustration">
          <img src="../assets/landing_illustration.svg" alt="" />
        </div>
      </section>
    </main>
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
}
.home-container {
  padding: 0 0 0 6rem;
}

.logo {
  text-decoration: underline;
  color: $secondary;
  font-size: 2rem;
}

section {
  text-align: center;
  display: flex;
}

.section-illustration {
  width: 100%;
  margin-top: 4rem;
  img {
    width: 100%;
    height: auto;
  }
}
.headline {
  margin: 7rem 0 4rem 0;
  h1 {
    font-weight: 500 !important;
    text-align: left;
  }
}

.call-to-action__label {
  text-align: left;
}
.call-to-action__buttons {
  margin-top: 1rem;
  text-align: left;
  // display: flex;
  // justify-content: center;
}
.call-to-action__button {
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
    h1 {
      text-align: center;
    }
  }
  .call-to-action__buttons {
    text-align: center;
  }
  .call-to-action__label {
    text-align: center;
  }
}
</style>
