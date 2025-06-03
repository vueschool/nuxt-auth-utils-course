<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { FetchError } from "ofetch";
const { openInPopup, loggedIn, fetch } = useUserSession();

const schema = z.object({
  name: z.string().min(1, "Name is required"),
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
    await $fetch("/auth/register", {
      method: "POST",
      body: event.data,
    });
    fetch();

    toast.add({
      title: "Thanks for registering!",
      color: "success",
    });
  } catch (e) {
    console.log(e instanceof FetchError);
    if (e instanceof FetchError) {
      toast.add({
        title: "Error",
        description: e.data.message,
        color: "error",
      });
      return;
    }
    toast.add({
      title: "Error",
      description: "An unknown error occurred. Please try again later.",
      color: "error",
    });
  }
}

watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) navigateTo("/admin");
});
</script>

<template>
  <UContainer class="flex justify-center items-center mt-10">
    <UCard class="w-96">
      <template #header>
        <h1 class="text-2xl font-semibold text-center">Register</h1>
      </template>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UButton block type="submit"> Submit </UButton>
      </UForm>

      <hr class="my-6" />

      <UButton color="neutral" block @click="openInPopup('/auth/github')">
        <UIcon name="i-simple-icons-github" class="mr-2" />
        Login with GitHub
      </UButton>
    </UCard>
  </UContainer>
</template>
