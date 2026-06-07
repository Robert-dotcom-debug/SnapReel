<template>
  <section class="account-page">
    <div class="account-panel">
      <RouterLink class="back-link" to="/">
        <ArrowLeft :size="17" />
        Volver al feed
      </RouterLink>

      <header class="account-header public-profile-header">
        <div class="account-avatar">{{ initial }}</div>
        <div class="public-profile-main">
          <p class="account-label">Perfil público</p>
          <div class="public-profile-title">
            <h1>@{{ profile?.username || "usuario" }}</h1>
            <button
              class="follow-button profile-follow-button"
              :class="{ following: stats.isFollowing }"
              :disabled="actionLoading"
              @click="handleFollowClick"
            >
              {{ stats.isFollowing ? "Siguiendo" : "Seguir" }}
            </button>
          </div>
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
        <button class="active" type="button">
          <Clapperboard :size="18" />
          Videos subidos
          <strong>{{ stats.videosSubidos }}</strong>
        </button>
      </div>

      <section class="account-list">
        <div class="list-title">
          <h2>Videos publicados</h2>
          <span>{{ uploadedVideos.length }}</span>
        </div>

        <div v-if="loading" class="empty-state">Cargando perfil...</div>
        <div v-else-if="uploadedVideos.length === 0" class="empty-state">
          Este usuario aún no subió videos.
        </div>
        <RouterLink
          v-for="video in uploadedVideos"
          v-else
          :key="video.id"
          class="video-row"
          :to="`/video/${video.id}`"
        >
          <video :src="video.videoUrl" muted playsinline></video>
          <div>
            <h3>{{ video.title || "Video sin título" }}</h3>
            <p>@{{ video.autor }}</p>
            <small>{{ video.likes }} likes · {{ video.comentarios }} comentarios</small>
          </div>
        </RouterLink>
      </section>
    </div>

    <div v-if="showUnfollowConfirm" class="flash-overlay" @click.self="showUnfollowConfirm = false">
      <div class="flash-dialog">
        <h2>Dejar de seguir</h2>
        <p>¿Deseas dejar de seguir a @{{ profile?.username }}?</p>
        <div class="flash-actions">
          <button class="flash-cancel" @click="showUnfollowConfirm = false">Cancelar</button>
          <button class="flash-confirm" :disabled="actionLoading" @click="unfollowUser">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Clapperboard } from "lucide-vue-next";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(true);
const actionLoading = ref(false);
const showUnfollowConfirm = ref(false);
const profile = ref(null);
const stats = ref({
  seguidores: 0,
  siguiendo: 0,
  videosSubidos: 0,
  isFollowing: false,
});
const uploadedVideos = ref([]);

const initial = computed(() => {
  const name = profile.value?.username || "S";
  return name.charAt(0).toUpperCase();
});

async function loadProfile() {
  const userId = route.params.userId;

  if (userId === auth.user?.id) {
    router.replace("/account");
    return;
  }

  loading.value = true;
  showUnfollowConfirm.value = false;

  try {
    const { data } = await api.get(`/api/users/profile?userId=${userId}`);
    profile.value = data.user;
    stats.value = data.stats;
    uploadedVideos.value = data.uploadedVideos;
  } finally {
    loading.value = false;
  }
}

async function followUser() {
  actionLoading.value = true;

  try {
    await api.post("/api/users/follow", { userId: route.params.userId });
    stats.value = {
      ...stats.value,
      isFollowing: true,
      seguidores: stats.value.seguidores + 1,
    };
  } finally {
    actionLoading.value = false;
  }
}

async function unfollowUser() {
  actionLoading.value = true;

  try {
    await api.post("/api/users/unfollow", { userId: route.params.userId });
    stats.value = {
      ...stats.value,
      isFollowing: false,
      seguidores: Math.max(0, stats.value.seguidores - 1),
    };
    showUnfollowConfirm.value = false;
  } finally {
    actionLoading.value = false;
  }
}

function handleFollowClick() {
  if (stats.value.isFollowing) {
    showUnfollowConfirm.value = true;
    return;
  }

  followUser();
}

onMounted(loadProfile);
watch(() => route.params.userId, loadProfile);
</script>
