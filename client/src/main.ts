import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import VueRecaptcha from "vue3-recaptcha-v2";

createApp(App)
  .use(router)
  .use(VueRecaptcha, {
    siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
    alterDomain: false,
  })
  .mount("#app");
