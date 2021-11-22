<script lang="ts" setup>
import { ref } from "@vue/reactivity";
import { Faq } from "../@types";

const isShown = ref(false);
const props = defineProps<{
  faq: Faq;
}>();
</script>

<template>
  <div class="accordion" @click="isShown = !isShown">
    <div class="accordion-summary">
      <div class="accordion-summary__content">
        {{ props.faq.question }}
      </div>
      <div class="arrow" :class="{ active: isShown }">
        <i class="fas fa-sort-down"></i>
      </div>
    </div>
    <div class="accordion-content" v-show="isShown">
      {{ props.faq.answer }}
    </div>
  </div>
</template>
<style lang="scss">
.accordion {
  margin: 1rem 0;
  cursor: pointer;
  padding: 1rem 0.4rem;
  transition: background 0.3s ease;

  &:hover {
    background: rgb(210, 224, 231);
  }
}
.accordion-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
}
.accordion-content {
  margin-top: 1.5rem;
}
.arrow {
  text-align: right;
  transition: transform 0.3s ease;
  font-size: 1.5rem;
  &.active {
    transform: rotate(180deg);
  }
}
</style>
