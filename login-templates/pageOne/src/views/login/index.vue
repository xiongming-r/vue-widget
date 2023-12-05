<template>
  <div class="login-container flx-center">
    <SwitchDark class="dark" />
    <div class="login-form">
      <div class="login-logo">
        <h2 class="logo-text">Admin</h2>
      </div>
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import SwitchDark from "@/components/SwitchDark/index.vue";
import LoginForm from "./components/LoginForm.vue";
</script>
<style lang="scss" scoped>
@import "./index.scss";
</style>
