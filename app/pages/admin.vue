<script setup>
definePageMeta({
  middleware: ["auth"],
});

const { data } = await useFetch("/api/admin");
</script>
<template>{{ data.sensitive }}</template>
