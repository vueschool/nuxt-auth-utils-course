<script setup>
definePageMeta({
  middleware: ["auth"],
});

const { data } = useFetch("/api/admin");
</script>
<template>{{ data.sensitive }}</template>
