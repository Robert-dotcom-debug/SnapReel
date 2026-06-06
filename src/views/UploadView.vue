<template>
  <section class="upload-page">
    <form class="upload-card" @submit.prevent="uploadVideo">
      <div class="form-kicker">
        <UploadCloud :size="18" />
        <span>Nuevo clip</span>
      </div>
      <h1>Subir video</h1>
      <p class="form-copy">Publica momentos cortos, directos y listos para moverse en el feed.</p>

      <label>
        <span>Título</span>
        <input v-model="title" placeholder="Nombre del video" required />
      </label>
      <label>
        <span>Descripción</span>
        <textarea v-model="description" placeholder="Cuéntale algo al feed"></textarea>
      </label>
      <label class="file-drop">
        <Video :size="24" />
        <span>{{ file ? file.name : "Selecciona un video" }}</span>
        <input type="file" accept="video/*" @change="handleFile" required />
      </label>

      <button :disabled="loading">
        <LoaderCircle v-if="loading" :size="18" class="spin" />
        <UploadCloud v-else :size="18" />
        {{ loading ? "Subiendo..." : "Publicar" }}
      </button>

      <p v-if="message" class="status-message">{{ message }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { LoaderCircle, UploadCloud, Video } from "lucide-vue-next";
import api from "../services/api";

const title = ref("");
const description = ref("");
const file = ref(null);
const loading = ref(false);
const message = ref("");

function handleFile(event) {
  file.value = event.target.files[0];
}

async function uploadVideo() {
  if (!file.value) return;

  loading.value = true;
  message.value = "";

  try {
    const { data: signatureData } = await api.post("/api/videos/upload-signature");

    const formData = new FormData();
    formData.append("file", file.value);
    formData.append("api_key", signatureData.apiKey);
    formData.append("timestamp", signatureData.timestamp);
    formData.append("signature", signatureData.signature);
    formData.append("folder", signatureData.folder);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    const uploaded = await uploadResponse.json();

    await api.post("/api/videos", {
      title: title.value,
      description: description.value,
      videoUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      thumbnailUrl: uploaded.secure_url.replace(".mp4", ".jpg"),
    });

    title.value = "";
    description.value = "";
    file.value = null;
    message.value = "Video publicado correctamente";
  } catch (error) {
    message.value = "Error al subir el video";
  } finally {
    loading.value = false;
  }
}
</script>
