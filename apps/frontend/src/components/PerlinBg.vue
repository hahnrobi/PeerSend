<template>
  <div class="bg">
    <div class="el">
    </div>
  </div>
</template>
<style scoped>
.bg {
  position: fixed;
  z-index: -1000;
  --size: 20px;
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  min-height: 100vh;
  opacity: .5;
}
.el {
  background: conic-gradient(from 180deg at 50% 70%,hsla(0,0%,98%,1) 0deg,#eec32d 72.0000010728836deg,#ec4b4b 144.0000021457672deg,#709ab9 216.00000858306885deg,#4dffbf 288.0000042915344deg,hsla(0,0%,98%,1) 1turn);
  width: 100%;
  height: 100%;
  mask:
    radial-gradient(circle at 50% 50%, white 2px, transparent 2.5px) 50% 50% / var(--size) var(--size),
    url("https://assets.codepen.io/605876/noise-mask.png") 256px 50% / 256px 256px;
  mask-composite: intersect;
  animation: flicker 20s infinite linear;
}

@keyframes flicker {
  to {
    mask-position: 50% 50%, 0 50%;
  }
}
</style>
