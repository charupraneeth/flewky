<template>
  <div id="wave">
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
  </div>
</template>

<style lang="scss">
#wave {
  position: relative;
  width: max-content;
  text-align: left;
  margin-left: 1rem;
  border-radius: 12px;

  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 3px;
    background: $tertiary;
    animation: wave 1.3s linear infinite;

    &:nth-child(2) {
      animation-delay: -1.1s;
    }

    &:nth-child(3) {
      animation-delay: -0.9s;
    }
  }
}

@keyframes wave {
  0%,
  60%,
  100% {
    transform: initial;
  }

  30% {
    transform: translateY(-15px);
  }
}
</style>
