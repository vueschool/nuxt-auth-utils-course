<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession();
</script>
<template>
  <UCard class="flex justify-end">
    <div v-if="loggedIn" class="flex items-center gap-4">
      {{ user?.login }}
      <UButton @click="clear()">Logout</UButton>
    </div>
    <div v-else>
      <UButton @click="openInPopup('/auth/github')">Login</UButton>
    </div>
  </UCard>
</template>
