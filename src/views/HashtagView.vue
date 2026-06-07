<template>
  <section class="account-page">
    <div class="account-panel">
      <RouterLink class="back-link" to="/">
        <ArrowLeft :size="17" />
        Volver al feed
      </RouterLink>

      <header class="hashtag-header">
        <span class="hashtag-mark">#</span>
        <div>
          <p class="account-label">Hashtag</p>
          <h1>#{{ tag }}</h1>
        </div>
      </header>

      <section class="account-list">
        <div class="list-title">
          <h2>Videos asociados</h2>
          <span>{{ videos.length }}</span>
        </div>

        <div v-if="loading" class="empty-state">Cargando videos...</div>
        <div v-else-if="videos.length === 0" class="empty-state">
          Aún no hay videos asociados a este hashtag.
        </div>
        <RouterLink
          v-for="video in videos"
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
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import api from "../services/api";

const route = useRoute();
const loading = ref(true);
const videos = ref([]);
const tag = computed(() => String(route.params.tag || "").toLowerCase());

async function loadHashtagVideos() {
  loading.value = true;

  try {
    const { data } = await api.get(`/api/hashtags/videos?tag=${tag.value}`);
    videos.value = data.videos;
  } finally {
    loading.value = false;
  }
}

onMounted(loadHashtagVideos);
watch(tag, loadHashtagVideos);
</script>
