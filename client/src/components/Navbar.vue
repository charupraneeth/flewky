<template>
  <nav class="navbar">
    <router-link class="logo" to="/">Flewky</router-link>
    <slot></slot>
  </nav>
</template>
<style lang="scss">
.logo {
  font-weight: bold;
  text-decoration: none;
  color: $secondary;
  font-size: 2rem;
}

nav.navbar {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
