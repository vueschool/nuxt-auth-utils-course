<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession();
</script>
<template>
  <UApp>
    <NavBar />
    <NuxtPage />
  </UApp>
</template>
<style>
@import "tailwindcss";
@import "@nuxt/ui";
</style>
