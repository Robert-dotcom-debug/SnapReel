<template>
  <section class="feed">
    <article v-for="video in videos" :key="video.id" class="video-card">
      <button v-if="showFollowButton(video)" class="follow-button" @click="followUser(video)">
        Seguir
      </button>

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
        @play="registerView(video.id)"
      ></video>

      <div class="video-info">
        <h2>{{ video.title || "Video sin título" }}</h2>
        <p>{{ video.description }}</p>
      </div>

      <div class="actions">
        <button
          class="action-button"
          :class="{ active: video.likedByMe }"
          aria-label="Impulsar"
          @click="like(video)"
        >
          <Leaf :size="24" />
        </button>
        <span>{{ video.likes }}</span>

        <button class="action-button" aria-label="Comentarios" @click="openComments(video)">
          <MessageSquareText :size="24" />
        </button>
        <span>{{ video.comentarios }}</span>

        <button class="action-button" aria-label="Compartir" @click="share(video)">
          <Waypoints :size="23" />
        </button>

        <small>{{ video.vistas }} vistas</small>
      </div>
    </article>

    <div v-if="selectedVideo" class="comments-panel">
      <div class="panel-header">
        <h3>Comentarios</h3>
        <button class="close" aria-label="Cerrar comentarios" @click="closeComments">
          <X :size="23" />
        </button>
      </div>

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
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { CircleX, Leaf, MessageSquareText, Send, Waypoints, X } from "lucide-vue-next";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const videos = ref([]);
const selectedVideo = ref(null);
const comments = ref([]);
const commentText = ref("");
const replyTarget = ref(null);

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
  if (!replyTarget.value) {
    return "Escribe un comentario...";
  }

  return `Responde a @${replyTarget.value.autor}`;
});

async function loadVideos() {
  const { data } = await api.get("/api/videos");
  videos.value = data;
}

async function like(video) {
  const { data } = await api.post("/api/videos/like", { videoId: video.id });
  video.likedByMe = data.liked;
  video.likes += data.liked ? 1 : -1;
  if (video.likes < 0) video.likes = 0;
  await loadVideos();
}

async function followUser(video) {
  await api.post("/api/users/follow", { userId: video.autorId });
  video.isFollowing = true;
  await loadVideos();
}

async function registerView(videoId) {
  await api.post("/api/videos/view", { videoId });
  await loadVideos();
}

async function openComments(video) {
  selectedVideo.value = video;
  cancelReply();
  const { data } = await api.get(`/api/comments?videoId=${video.id}`);
  comments.value = data;
}

function closeComments() {
  selectedVideo.value = null;
  comments.value = [];
  cancelReply();
}

async function sendComment() {
  if (!commentText.value.trim()) return;

  await api.post("/api/comments", {
    videoId: selectedVideo.value.id,
    text: commentText.value,
    parentCommentId: replyTarget.value?.id || null,
  });

  commentText.value = "";
  cancelReply();
  await openComments(selectedVideo.value);
  await loadVideos();
}

function startReply(comment) {
  replyTarget.value = comment;
}

function cancelReply() {
  replyTarget.value = null;
}

function share(video) {
  navigator.clipboard.writeText(window.location.origin + "/?video=" + video.id);
  alert("Enlace copiado");
}

function avatarInitial(username) {
  return (username || "S").charAt(0).toUpperCase();
}

function profileRoute(video) {
  if (video.autorId === auth.user?.id) {
    return "/account";
  }

  return `/profile/${video.autorId}`;
}

function showFollowButton(video) {
  return video.autorId !== auth.user?.id && !video.isFollowing;
}

onMounted(loadVideos);
</script>
