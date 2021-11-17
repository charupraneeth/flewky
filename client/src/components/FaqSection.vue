<script setup lang="ts">
import Accordion from "../components/Accordion.vue";

const faqs = [
  {
    question: "What is Flewky?",
    answer:
      "Flewky is a website that allows you to chat with random college students",
  },
  {
    question: "Do you store any of the users data?",
    answer:
      "No, we do not store any of our users data, except when you are banned.",
  },
  {
    question: "What is so special about Flewky?",
    answer:
      "An important feature of Flewky is that the site uses a technology called webRTC, which is a peer to peer protocol, which means most of your communications are directly done among user devices rather than going through a server.",
  },
  {
    question: "Don't find your questions here?",
    answer: "Feel free to mail us at support@flewky.com",
  },
];
</script>

<template>
  <section class="faq-section">
    <h1>Frequently answered questions</h1>
    <Accordion v-for="(faq, index) in faqs" :key="index" :faq="faq" />
  </section>
</template>
<style lang="scss">
.faq-section {
  display: block !important;
  margin: 2rem 0 !important;
}
h1 {
  color: $secondary;
}
.arrow {
  color: black;
}
</style>
