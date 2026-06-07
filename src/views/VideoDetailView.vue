<template>
  <section class="feed">
    <article v-if="video" class="video-card">
      <RouterLink class="video-back-link" to="/account">
        <ArrowLeft :size="17" />
        Cuenta
      </RouterLink>

      <div class="video-author">
        <RouterLink class="author-name" :to="profileRoute(video)">
          @{{ video.autor }}
        </RouterLink>
        <RouterLink
          class="profile-link"
          :to="profileRoute(video)"
          :aria-label="`Ver perfil de ${video.autor}`"
        >
          {{ avatarInitial(video.autor) }}
        </RouterLink>
      </div>

      <video
        :src="video.videoUrl"
        class="video-player"
        controls
        loop
        playsinline
        @play="registerView"
        @pointerup="handleVideoTap"
      ></video>

      <div class="video-info">
        <h2>{{ video.title || "Video sin título" }}</h2>
        <p>
          <template v-for="(part, index) in descriptionParts(video.description)" :key="index">
            <RouterLink
              v-if="part.type === 'hashtag'"
              class="hashtag-pill"
              :to="`/hashtag/${part.tag}`"
            >
              {{ part.value }}
            </RouterLink>
            <span v-else>{{ part.value }}</span>
          </template>
        </p>
      </div>

      <div class="actions">
        <button
          class="action-button"
          :class="{ active: video.likedByMe }"
          aria-label="Impulsar"
          @click="like"
        >
          <Leaf :size="24" />
        </button>
        <span>{{ video.likes }}</span>

        <button class="action-button" aria-label="Comentarios" @click="openComments">
          <MessageSquareText :size="24" />
        </button>
        <span>{{ video.comentarios }}</span>

        <button class="action-button" aria-label="Compartir" @click="share">
          <Waypoints :size="23" />
        </button>

        <small>{{ video.vistas }} vistas</small>
      </div>
    </article>

    <div v-if="commentsOpen && video" class="comments-backdrop" @click.self="closeComments">
      <div class="comments-panel">
        <div class="panel-header">
          <h3>Comentarios</h3>
          <button class="close" aria-label="Cerrar comentarios" @click="closeComments">
            <X :size="23" />
          </button>
        </div>

        <div class="comments-list">
          <div v-for="thread in commentThreads" :key="thread.id" class="comment-thread">
            <div class="comment">
              <strong>@{{ thread.autor }}</strong>
              <p>{{ thread.text }}</p>
              <button class="reply-button" @click="startReply(thread)">Responder</button>
            </div>

            <div v-for="reply in thread.replies" :key="reply.id" class="comment comment-reply">
              <strong>@{{ reply.autor }}</strong>
              <p>{{ reply.text }}</p>
            </div>
          </div>
        </div>

        <form class="comment-form" :class="{ replying: replyTarget }" @submit.prevent="sendComment">
          <input v-model="commentText" :placeholder="commentPlaceholder" />
          <button
            v-if="replyTarget"
            class="cancel-reply"
            type="button"
            aria-label="Cancelar respuesta"
            @click="cancelReply"
          >
            <CircleX :size="18" />
          </button>
          <button aria-label="Enviar comentario">
            <Send :size="18" />
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft,
  CircleX,
  Leaf,
  MessageSquareText,
  Send,
  Waypoints,
  X,
} from "lucide-vue-next";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";
import { descriptionParts } from "../utils/hashtags";

const route = useRoute();
const auth = useAuthStore();
const video = ref(null);
const commentsOpen = ref(false);
const comments = ref([]);
const commentText = ref("");
const replyTarget = ref(null);
const viewedVideoIds = new Set();
let tapTimer = null;

const commentThreads = computed(() => {
  const parents = comments.value
    .filter((comment) => !comment.respondeA)
    .map((comment) => ({ ...comment, replies: [] }));
  const parentMap = new Map(parents.map((comment) => [comment.id, comment]));

  comments.value
    .filter((comment) => comment.respondeA)
    .forEach((reply) => {
      parentMap.get(reply.respondeA)?.replies.push(reply);
    });

  return parents;
});

const commentPlaceholder = computed(() => {
  if (!replyTarget.value) return "Escribe un comentario...";
  return `Responde a @${replyTarget.value.autor}`;
});

async function loadVideo() {
  const { data } = await api.get(`/api/videos/detail?videoId=${route.params.videoId}`);
  video.value = data;
}

async function like() {
  const { data } = await api.post("/api/videos/like", { videoId: video.value.id });
  video.value.likedByMe = data.liked;
  video.value.likes += data.liked ? 1 : -1;
  if (video.value.likes < 0) video.value.likes = 0;
}

async function registerView() {
  if (viewedVideoIds.has(video.value.id)) return;

  viewedVideoIds.add(video.value.id);
  await api.post("/api/videos/view", { videoId: video.value.id });
}

async function openComments() {
  commentsOpen.value = true;
  cancelReply();
  const { data } = await api.get(`/api/comments?videoId=${video.value.id}`);
  comments.value = data;
}

function closeComments() {
  commentsOpen.value = false;
  comments.value = [];
  cancelReply();
}

async function sendComment() {
  if (!commentText.value.trim()) return;

  await api.post("/api/comments", {
    videoId: video.value.id,
    text: commentText.value,
    parentCommentId: replyTarget.value?.id || null,
  });

  commentText.value = "";
  cancelReply();
  await openComments();
  await loadVideo();
}

function startReply(comment) {
  replyTarget.value = comment;
}

function cancelReply() {
  replyTarget.value = null;
}

function share() {
  navigator.clipboard.writeText(`${window.location.origin}/video/${video.value.id}`);
  alert("Enlace copiado");
}

function avatarInitial(username) {
  return (username || "S").charAt(0).toUpperCase();
}

function profileRoute(currentVideo) {
  if (currentVideo.autorId === auth.user?.id) return "/account";
  return `/profile/${currentVideo.autorId}`;
}

function handleVideoTap(event) {
  if (event.pointerType === "mouse") return;

  const videoElement = event.currentTarget;

  if (tapTimer) {
    clearTimeout(tapTimer);
    tapTimer = null;
    return;
  }

  tapTimer = setTimeout(() => {
    if (videoElement.paused) {
      videoElement.muted = false;
      videoElement.play().catch(() => {});
    } else {
      videoElement.pause();
    }

    tapTimer = null;
  }, 220);
}

onMounted(loadVideo);
</script>
