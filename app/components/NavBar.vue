<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession();
</script>
<template>
  <UCard class="flex justify-end">
    <div v-if="loggedIn" class="flex items-center gap-4">
      {{ user?.login }}
      <UButton
        @click="
          clear();
          navigateTo('/login');
        "
        >Logout</UButton
      >
    </div>
    <div v-else>
      <UButton as-child>
        <NuxtLink to="/login">Login</NuxtLink>
      </UButton>
    </div>
  </UCard>
</template>
