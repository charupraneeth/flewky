<script lang="ts" setup>
// This starter template is using Vue 3 <script setup> SFCs

import { createToast } from "mosha-vue-toastify";

let offlineTimer: NodeJS.Timer;

// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
document.addEventListener("blur", () => {
  document.title = "Flewky - 👋 here";
});

document.addEventListener("focus", () => {
  document.title = "Flewky";
});
window.addEventListener("offline", () => {
  console.log("device offline");
  offlineTimer = setInterval(() => {
    createToast("seems like your device is offline", { type: "warning" });
  }, 5000);
});

window.addEventListener("online", () => {
  clearInterval(offlineTimer);
  createToast("back online!!!", { type: "success" });
});
</script>

<template>
  <main>
    <router-view></router-view>
  </main>
</template>

<style lang="scss">
#app {
  height: 100%;
}

main {
  max-width: 950px;
  margin: 0 auto;
  height: 100%;
  min-height: 100%;
  background: $primary;
  border: 1px solid rgb(239, 243, 244);
  padding: 0 1rem;
}
@media screen and (max-width: 640px) {
  main {
    padding: 0 0.125rem;
  }
}
</style>
