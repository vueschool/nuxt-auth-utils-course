<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession();
</script>
<template>
  <div>
    {{ user }}
  </div>
</template>
