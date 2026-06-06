<template>
  <main class="app-shell">
    <router-view />

    <nav v-if="showNavigation" class="bottom-nav">
      <RouterLink to="/" aria-label="Inicio">
        <Home :size="21" stroke-width="2.4" />
        <span>Inicio</span>
      </RouterLink>
      <RouterLink to="/upload" aria-label="Subir">
        <span class="create-pill">
          <Plus :size="22" stroke-width="2.6" />
        </span>
        <span>Subir</span>
      </RouterLink>
      <RouterLink to="/account" aria-label="Cuenta">
        <User :size="21" stroke-width="2.4" />
        <span>Cuenta</span>
      </RouterLink>
    </nav>
  </main>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Home, Plus, User } from "lucide-vue-next";

const route = useRoute();
const showNavigation = computed(() => !route.meta.guestOnly);
</script>
