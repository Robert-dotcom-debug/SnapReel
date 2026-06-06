<template>
  <section class="upload-page">
    <form class="upload-card" @submit.prevent="uploadVideo">
      <h1>Subir video</h1>

      <input v-model="title" placeholder="Título" required />
      <textarea v-model="description" placeholder="Descripción"></textarea>
      <input type="file" accept="video/*" @change="handleFile" required />

      <button :disabled="loading">
        {{ loading ? "Subiendo..." : "Publicar" }}
      </button>

      <p v-if="message">{{ message }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue";
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