<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
const { openInPopup, loggedIn, fetch } = useUserSession();
import { FetchError } from "ofetch";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/auth/login", {
      method: "POST",
      body: event.data,
    });
    toast.add({
      title: "Logged In Successfully!",
      description: "Welcome!",
      color: "success",
    });
    fetch();
  } catch (error) {
    if (error instanceof FetchError) {
      toast.add({
        title: "Error Logging In",
        description: error.data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: "Error Logging In",
        description: "There was an issue logging. Please contact support",
        color: "error",
      });
    }
  }

  console.log(event.data);
}

watch(loggedIn, () => {
  if (loggedIn.value) navigateTo("/admin");
});
</script>

<template>
  <UCard class="max-w-md m-auto my-10">
    <template #header>
      <h1 class="text-2xl text-center">Login</h1>
    </template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
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
      Login with Github
    </UButton>
  </UCard>
</template>
