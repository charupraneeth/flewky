<script setup lang="ts">
import { ref } from "@vue/reactivity";
import { createToast } from "mosha-vue-toastify";
import Loader from "../components/Loader.vue";
import Navbar from "../components/Navbar.vue";
import ismail from "ismail";
import { Jiglag } from "../@types";
import router from "../router";
import { onMounted } from "@vue/runtime-core";
// import { useRecaptcha, VueRecaptcha } from "vue3-recaptcha-v2";
// @ts-ignore next-line
import VueHcaptcha from "@hcaptcha/vue3-hcaptcha";
import { isCollegeMail } from "../utils";
import Footer from "../components/Footer.vue";
import FaqSection from "../components/FaqSection.vue";

const emailInput = ref("");
const loading = ref(false);
const isMailSent = ref(false);
const verificationCode = ref("");
const captchaToken = ref("");

// const { resetRecaptcha } = useRecaptcha();
const hcaptchaWidget = ref<HTMLDivElement>();
const hcaptchaSiteKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

async function handleCapchaVerify(token: string, ekey: string) {
  console.log("token ", token);
  console.log("ekey ", ekey);
  captchaToken.value = token;
  try {
    loading.value = true;
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/v1/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value,
          captchaToken: captchaToken.value,
        }),
      }
    );

    const json = await response.json();
    console.log(json);
    if (!response.ok) {
      throw new Error(json.error || "bad response");
    }

    if (json.error) {
      throw new Error(json.error);
    }
    if (json.message !== "success") {
      throw new Error();
    }
    createToast(`sucessfully sent email to ${emailInput.value}`, {
      type: "info",
    });
    isMailSent.value = true;
    loading.value = false;
  } catch (error: Error | any) {
    loading.value = false;
    console.error(error);
    createToast(error.message || "failed to verify email");
    resetCaptcha();
  }
}
const handleCaptchaExpiry = () => {
  console.log("expired!");
  captchaToken.value = "";
  resetCaptcha();
};
const handleCaptchaError = () => {
  console.log("fail");
  createToast("failed to render captcha, try reloading", { type: "danger" });
  captchaToken.value = "";
};

function handleCaptchaRender() {
  console.log("captcha redered");
}
// Reset Recaptcha action

function resetCaptcha() {
  // @ts-ignore next-line
  hcaptchaWidget.value?.reset();
}
async function verifyCode() {
  try {
    if (!verificationCode.value || !verificationCode.value.trim()) {
      createToast("invalid code", { type: "warning" });
      return;
    }
    loading.value = true;
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/v1/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value,
          code: verificationCode.value,
        }),
      }
    );

    const json = await response.json();
    console.log(json);
    if (!response.ok) {
      throw new Error(json.error || "bad response");
    }

    if (json.error) {
      throw new Error(json.error);
    }
    if (json.message !== "success") {
      throw new Error();
    }
    if (!json.data) {
      throw new Error("invalid token recieved");
    }
    createToast("sucessfully verified code", { type: "info" });
    const data: Jiglag = { email: emailInput.value, token: json.data };
    localStorage.setItem("jiglag", JSON.stringify(data));
    loading.value = false;
    router.push("/");
  } catch (error: any) {
    loading.value = false;
    console.error(error);
    createToast(error.message || "failed to verify code");
  }
}

async function verifyEmail() {
  if (!emailInput.value || !emailInput.value.trim()) {
    createToast("invalid email", { type: "warning" });
    return;
  }
  const { valid } = ismail(emailInput.value);
  if (!valid) {
    createToast("invalid email", { type: "warning" });
    return;
  }
  if (!isCollegeMail(emailInput.value)) {
    createToast("invalid college email", { type: "warning" });
    return;
  }
  // @ts-ignore next-line
  hcaptchaWidget.value.execute();
}
onMounted(() => {
  const jiglag = localStorage.getItem("jiglag");

  if (jiglag) {
    router.push("/");
  }
});
</script>

<template>
  <section class="loader-section" v-if="loading">
    <Loader />
  </section>
  <div class="login-container" v-else>
    <Navbar />
    <section class="landing-section">
      <div class="left-section">
        <div class="email-form" v-if="!isMailSent">
          <div class="email-wrap">
            <label for="email">Enter you email below</label>
            <input
              v-model="emailInput"
              class="email"
              type="email"
              name="email"
              id="email"
              placeholder="name@school.edu.in"
              maxlength="100"
            />
          </div>
          <div>
            <vue-hcaptcha
              ref="hcaptchaWidget"
              size="invisible"
              :sitekey="hcaptchaSiteKey"
              @error="handleCaptchaError"
              @verify="handleCapchaVerify"
              @expired="handleCaptchaExpiry"
              @rendered="handleCaptchaRender"
              @challenge-expired="handleCaptchaExpiry"
            ></vue-hcaptcha>
            <button class="btn-secondary" type="submit" @click="verifyEmail">
              verify email
            </button>
          </div>
        </div>
        <div class="vcode-form" v-else>
          <div class="vcode-wrap">
            <label for="email">Enter you verification code below</label>
            <br />
            <br />
            <small
              >Mail not found? please check the promotions and spam
              section</small
            >
            <input
              v-model="verificationCode"
              class="code"
              type="text"
              name="code"
              id="code"
              placeholder="909090"
              maxlength="6"
            />
          </div>
          <div>
            <button class="btn-secondary" type="submit" @click="verifyCode">
              verify code
            </button>
          </div>
        </div>
      </div>

      <div class="section-illustration">
        <img src="../assets/landing_illustration.svg" alt="" />
      </div>
    </section>
    <faq-section v-if="!isMailSent"></faq-section>
    <Footer />
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.loader-section {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.landing-section {
  display: flex;
  justify-content: center;
  min-height: 80vh;
}
.section-illustration {
  width: 100%;
  display: flex;
  img {
    width: 100%;
    height: auto;
  }
}
.left-section {
  width: 100%;
  text-align: left;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
}

.email-wrap,
.vcode-wrap {
  label {
    font-weight: bold;
    color: $secondary;
    font-size: 2rem;
  }
}
.email,
.code {
  width: 100%;
  margin: 1.2rem 0;
  background: transparent;
  padding: 0.5rem 0.2rem;
  font-size: 1rem;
  border: none;
  border-bottom: 1px solid black;
  outline: none;
}
button {
  margin: 1rem 0;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
  &:hover {
    // box-shadow: 0px 2px black;
    transform: translateY(-3px);
  }
  &:active {
    transform: scale(0.9);
  }
}
.vcode-wrap {
  margin-top: 1rem;
}

@media screen and (max-width: 640px) {
  .login-container {
    padding: 0 1rem;
  }
  section {
    flex-direction: column-reverse;
  }
  .section-illustration {
    margin-top: 0;
  }
}
</style>
