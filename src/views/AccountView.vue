<template>
  <section class="account-page">
    <div class="account-panel">
      <header class="account-header">
        <div class="account-avatar">{{ initial }}</div>
        <div>
          <p class="account-label">Cuenta activa</p>
          <h1>@{{ profile?.username || auth.user?.username }}</h1>
          <p>{{ profile?.email || auth.user?.email }}</p>
        </div>
      </header>

      <div class="account-stats">
        <div>
          <strong>{{ stats.seguidores }}</strong>
          <span>Seguidores</span>
        </div>
        <div>
          <strong>{{ stats.siguiendo }}</strong>
          <span>Siguiendo</span>
        </div>
      </div>

      <div class="account-actions">
        <button :class="{ active: activeList === 'uploaded' }" @click="activeList = 'uploaded'">
          <Clapperboard :size="18" />
          Videos subidos
          <strong>{{ stats.videosSubidos }}</strong>
        </button>
        <button :class="{ active: activeList === 'liked' }" @click="activeList = 'liked'">
          <Sprout :size="18" />
          Videos con like
          <strong>{{ stats.videosConLike }}</strong>
        </button>
      </div>

      <section class="account-list">
        <div class="list-title">
          <h2>{{ listTitle }}</h2>
          <span>{{ activeVideos.length }}</span>
        </div>

        <div v-if="loading" class="empty-state">Cargando cuenta...</div>
        <div v-else-if="activeVideos.length === 0" class="empty-state">{{ emptyText }}</div>
        <article v-for="video in activeVideos" v-else :key="video.id" class="video-row">
          <video :src="video.videoUrl" muted playsinline></video>
          <div>
            <h3>{{ video.title || "Video sin título" }}</h3>
            <p>@{{ video.autor }}</p>
            <small>{{ video.likes }} likes · {{ video.vistas }} vistas</small>
          </div>
        </article>
      </section>

      <button class="logout-button" @click="logout">
        <LogOut :size="18" />
        Cerrar sesión
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Clapperboard, LogOut, Sprout } from "lucide-vue-next";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const loading = ref(true);
const profile = ref(null);
const stats = ref({
  seguidores: 0,
  siguiendo: 0,
  videosSubidos: 0,
  videosConLike: 0,
});
const uploadedVideos = ref([]);
const likedVideos = ref([]);
const activeList = ref("uploaded");

const initial = computed(() => {
  const name = profile.value?.username || auth.user?.username || "S";
  return name.charAt(0).toUpperCase();
});

const activeVideos = computed(() =>
  activeList.value === "uploaded" ? uploadedVideos.value : likedVideos.value
);

const listTitle = computed(() =>
  activeList.value === "uploaded" ? "Tus videos" : "Videos que impulsaste"
);

const emptyText = computed(() =>
  activeList.value === "uploaded"
    ? "Aún no subiste videos desde esta cuenta."
    : "Aún no diste like a ningún video."
);

async function loadProfile() {
  loading.value = true;

  try {
    const { data } = await api.get("/api/auth/me");
    profile.value = data.user;
    stats.value = data.stats;
    uploadedVideos.value = data.uploadedVideos;
    likedVideos.value = data.likedVideos;
  } finally {
    loading.value = false;
  }
}

function logout() {
  auth.logout();
  router.push("/login");
}

onMounted(loadProfile);
</script>
