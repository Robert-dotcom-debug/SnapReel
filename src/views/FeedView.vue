<template>
  <section class="feed">
    <article v-for="video in videos" :key="video.id" class="video-card">
      <video
        :src="video.videoUrl"
        class="video-player"
        controls
        loop
        playsinline
        @play="registerView(video.id)"
      ></video>

      <div class="video-info">
        <h2>@{{ video.autor }}</h2>
        <p>{{ video.description }}</p>
      </div>

      <div class="actions">
        <button @click="like(video.id)">❤️</button>
        <span>{{ video.likes }}</span>

        <button @click="openComments(video)">💬</button>
        <span>{{ video.comentarios }}</span>

        <button @click="share(video)">↗</button>

        <small>{{ video.vistas }} vistas</small>
      </div>
    </article>

    <div v-if="selectedVideo" class="comments-panel">
      <button class="close" @click="selectedVideo = null">×</button>
      <h3>Comentarios</h3>

      <div v-for="comment in comments" :key="comment.id" class="comment">
        <strong>@{{ comment.autor }}</strong>
        <p>{{ comment.text }}</p>
        <button @click="replyTo = comment.id">Responder</button>
      </div>

      <form @submit.prevent="sendComment">
        <input v-model="commentText" placeholder="Escribe un comentario..." />
        <button>Enviar</button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import api from "../services/api";

const videos = ref([]);
const selectedVideo = ref(null);
const comments = ref([]);
const commentText = ref("");
const replyTo = ref(null);

async function loadVideos() {
  const { data } = await api.get("/api/videos");
  videos.value = data;
}

async function like(videoId) {
  await api.post("/api/videos/like", { videoId });
  await loadVideos();
}

async function registerView(videoId) {
  await api.post("/api/videos/view", { videoId });
  await loadVideos();
}

async function openComments(video) {
  selectedVideo.value = video;
  const { data } = await api.get(`/api/comments?videoId=${video.id}`);
  comments.value = data;
}

async function sendComment() {
  if (!commentText.value.trim()) return;

  await api.post("/api/comments", {
    videoId: selectedVideo.value.id,
    text: commentText.value,
    parentCommentId: replyTo.value,
  });

  commentText.value = "";
  replyTo.value = null;
  await openComments(selectedVideo.value);
  await loadVideos();
}

function share(video) {
  navigator.clipboard.writeText(window.location.origin + "/?video=" + video.id);
  alert("Enlace copiado");
}

onMounted(loadVideos);
</script>