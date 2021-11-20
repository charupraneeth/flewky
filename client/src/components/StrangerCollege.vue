<script lang="ts" setup>
import { toRef } from "@vue/reactivity";
import gState from "../store";

const props = defineProps<{
  college: string;
}>();

const isMobile = toRef(gState, "isMobile");
</script>

<template>
  <div class="stranger-college" :title="college">
    {{ props.college }}
    <span v-if="isMobile" class="stranger-college__tooltip">{{
      props.college
    }}</span>
  </div>
</template>

<style lang="scss">
.stranger-college {
  justify-self: start;
  display: inline-block;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
  max-width: 100px;
}

.stranger-college__tooltip {
  display: none;
  position: absolute;
  top: -30px;
  right: 10px;
  color: white;
  background: black;
  z-index: 1;
  padding: 1rem;
  white-space: nowrap;
}

.stranger-college:hover .stranger-college__tooltip {
  display: block;
}
</style>
