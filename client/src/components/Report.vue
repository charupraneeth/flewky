<script lang="ts" setup>
import { ref } from "@vue/reactivity";
import { createToast } from "mosha-vue-toastify";
import gState from "../store";

const isDisabled = ref(false);
function handleReport() {
  try {
    gState.IO.emit("report");
    console.log("reporting");
    isDisabled.value = true;
  } catch (error) {
    createToast("failed to report");
  }
}
</script>

<template>
  <button @click="handleReport" class="btn report-btn" :disabled="isDisabled">
    Report
  </button>
</template>
<style scoped lang="scss">
.report-btn {
  top: 15px;
  right: 10px;
  position: absolute;
  z-index: 5;
  padding: 0.5rem;
  background: red;
  color: $primary;
}
@media screen and (max-width: 640px) {
  .report-btn {
    right: unset;
    left: 10px;
  }
}
</style>
