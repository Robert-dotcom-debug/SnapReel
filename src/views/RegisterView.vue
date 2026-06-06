<template>
  <section class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <h1>Crear cuenta</h1>

      <input v-model="username" placeholder="Usuario" required />
      <input v-model="email" type="email" placeholder="Correo" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />

      <button>Registrarme</button>

      <RouterLink to="/login">Ya tengo cuenta</RouterLink>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  try {
    await auth.register(username.value, email.value, password.value);
    router.push("/");
  } catch {
    error.value = "No se pudo crear la cuenta";
  }
}
</script>