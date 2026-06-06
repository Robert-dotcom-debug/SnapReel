<template>
  <section class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <div class="brand-lockup">
        <span class="brand-mark">S</span>
        <strong>SnapReel</strong>
      </div>
      <h1>Crear cuenta</h1>
      <p class="form-copy">Elige tu nombre, entra al feed y empieza a construir tu canal.</p>

      <label>
        <span>Usuario</span>
        <input v-model="username" placeholder="@usuario" required />
      </label>
      <label>
        <span>Correo</span>
        <input v-model="email" type="email" placeholder="tu@email.com" required />
      </label>
      <label>
        <span>Contraseña</span>
        <input v-model="password" type="password" placeholder="Crea una contraseña" required />
      </label>

      <button :disabled="loading">
        <LoaderCircle v-if="loading" :size="18" class="spin" />
        <UserPlus v-else :size="18" />
        {{ loading ? "Creando..." : "Registrarme" }}
      </button>

      <RouterLink to="/login">Ya tengo cuenta</RouterLink>

      <p v-if="success" class="success">{{ success }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LoaderCircle, UserPlus } from "lucide-vue-next";
import { useAuthStore } from "../stores/auth";

const username = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const success = ref("");
const loading = ref(false);
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  error.value = "";
  success.value = "";
  loading.value = true;

  try {
    await auth.register(username.value, email.value, password.value);
    success.value = "Cuenta creada satisfactoriamente. Ingresando...";
    setTimeout(() => router.push("/"), 900);
  } catch {
    error.value = "No se pudo crear la cuenta";
  } finally {
    loading.value = false;
  }
}
</script>
