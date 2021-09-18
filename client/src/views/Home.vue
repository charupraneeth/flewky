<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { useRouter } from "vue-router";
import gState from "../store/index";

const router = useRouter();
function handleConnect() {
  const ioObject: Socket = io(import.meta.env.VITE_SERVER_URL, {
    transports: ["websocket", "polling"],
  });
  gState.IO = ioObject;

  gState.IO.on("connect", () => {
    router.push("/app");
  });
}
</script>
<template>
  <div class="home-container">
    <nav>
      <router-link class="logo" to="/">WIII logo</router-link>
    </nav>
    <section>
      <div class="section-intro">
        <div class="headline">
          <h1>From strangers to friends the journey just got easy</h1>
        </div>
        <div class="call-to-action">
          <h3 class="call-to-action__label">Start chatting :</h3>
          <div class="call-to-action__buttons">
            <button
              class="btn call-to-action__button btn-secondary"
              @click="handleConnect"
            >
              Video
            </button>
            <button
              class="btn call-to-action__button btn-primary"
              @click="handleConnect"
            >
              Text
            </button>
          </div>
        </div>
      </div>
      <div class="section-illustration">
        <img src="../assets/landing_illustration.svg" alt="" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
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
  display: flex;
  justify-content: center;
}
.call-to-action__button {
  font-weight: bold;
  font-size: 1rem;
  margin-right: 1rem;
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
  .call-to-action__label {
    text-align: center;
  }
  .call-to-action__button {
    padding: 0.8rem 2rem;
  }
}
</style>
