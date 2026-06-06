<template>
  <section class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <div class="brand-lockup">
        <span class="brand-mark">S</span>
        <strong>SnapReel</strong>
      </div>
      <h1>Iniciar sesión</h1>
      <p class="form-copy">Vuelve al feed y mantén tu cuenta lista para publicar.</p>

      <label>
        <span>Correo</span>
        <input v-model="email" type="email" placeholder="tu@email.com" required />
      </label>
      <label>
        <span>Contraseña</span>
        <input v-model="password" type="password" placeholder="Tu contraseña" required />
      </label>

      <button :disabled="loading">
        <LoaderCircle v-if="loading" :size="18" class="spin" />
        <LogIn v-else :size="18" />
        {{ loading ? "Entrando..." : "Entrar" }}
      </button>

      <RouterLink to="/register">Crear cuenta</RouterLink>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LoaderCircle, LogIn } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  error.value = "";
  loading.value = true;

  try {
    await auth.login(email.value, password.value);
    router.push("/");
  } catch {
    error.value = "Correo o contraseña incorrectos";
  } finally {
    loading.value = false;
  }
}
</script>
