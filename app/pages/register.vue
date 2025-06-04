<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
const { openInPopup, loggedIn, fetch } = useUserSession();
import { FetchError } from "ofetch";

const schema = z.object({
  name: z.string(),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/auth/register", {
      method: "POST",
      body: event.data,
    });
    fetch();
    toast.add({
      title: "User Registered",
      description: "Thanks for registering!",
      color: "success",
    });
  } catch (error) {
    if (error instanceof FetchError) {
      toast.add({
        title: "Error Registering",
        description: error.data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: "Error Registering",
        description: "There was an issue registering. Please contact support",
        color: "error",
      });
    }
  }
}

watch(loggedIn, () => {
  if (loggedIn.value) navigateTo("/admin");
});
</script>

<template>
  <UCard class="max-w-md m-auto my-10">
    <template #header>
      <h1 class="text-2xl text-center">Register</h1>
    </template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Name" name="name">
        <UInput v-model="state.name" class="w-full" />
      </UFormField>
      <UFormField label="Email" name="email">
        <UInput v-model="state.email" class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" />
      </UFormField>

      <UButton type="submit" block> Submit </UButton>
    </UForm>

    <UButton
      variant="outline"
      block
      class="mt-5"
      @click="openInPopup('/auth/github')"
    >
      <UIcon name="i-simple-icons-github" class="mr-2" />
      Register with Github
    </UButton>
  </UCard>
</template>
