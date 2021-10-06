<script setup lang="ts">
import { ref } from "@vue/reactivity";
import { createToast } from "mosha-vue-toastify";
import Loader from "../components/Loader.vue";
import ismail from "ismail";
import { Jiglag } from "../@types";
import router from "../router";
import { onMounted } from "@vue/runtime-core";

const emailInput = ref("");
const loading = ref(false);
const isMailSent = ref(false);
const verificationCode = ref("");

async function verifyCode() {
  try {
    if (!verificationCode.value || !verificationCode.value.trim()) {
      createToast("invalid email", { type: "warning" });
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

    if (!response.ok) {
      throw new Error("bad response");
    }
    const json = await response.json();
    console.log(json);

    if (json.error) {
      throw new Error(json.error);
    }
    if (json.message !== "success") {
      throw new Error();
    }
    if (!json.data) {
      throw new Error("invalid token recieved");
    }
    createToast("sucessfully sent email", { type: "info" });
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
  try {
    if (!emailInput.value || !emailInput.value.trim()) {
      createToast("invalid email", { type: "warning" });
      return;
    }
    const { valid } = ismail(emailInput.value);
    if (!valid) {
      createToast("invalid email", { type: "warning" });
      return;
    }
    loading.value = true;
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/api/v1/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailInput.value }),
      }
    );
    if (!response.ok) {
      throw new Error("bad response");
    }
    const json = await response.json();
    console.log(json);

    if (json.error) {
      throw new Error(json.error);
    }
    if (json.message !== "success") {
      throw new Error();
    }
    createToast("sucessfully sent email", { type: "info" });
    isMailSent.value = true;
    loading.value = false;
  } catch (error: Error | any) {
    loading.value = false;
    console.error(error);
    createToast(error.message || "failed to verify email");
  }
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
    <main>
      <nav>
        <router-link class="logo" to="/">WIII logo</router-link>
      </nav>
      <section>
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
              <button class="btn-secondary" type="submit" @click="verifyEmail">
                verify email
              </button>
            </div>
          </div>
          <div class="vcode-form" v-else>
            <div class="vcode-wrap">
              <label for="email">Enter you verification code below</label>
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
    </main>
  </div>
</template>

<style lang="scss">
.login-container {
  height: 100%;
}
.login-container {
  padding: 0 0 0 6rem;
}

.logo {
  text-decoration: underline;
  color: $secondary;
  font-size: 2rem;
}
.loader-section {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

section {
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
.left-section {
  width: 100%;

  text-align: left;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
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
</style>
