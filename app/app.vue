<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession();
</script>
<template>
  <NavBar />
  <NuxtPage />
</template>
<style>
@import "tailwindcss";
@import "@nuxt/ui";
</style>
