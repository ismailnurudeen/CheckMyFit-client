<template>
  <div id="app">
    <h1>AI Outfit Rating</h1>
    <input type="file" @change="onFileChange" accept="image/*" style="display: none;" ref="fileInput">
    <button @click="toggleCamera">{{ isCameraOpen ? 'Close Camera' : 'Capture from Camera' }}</button>
    <button @click="triggerFileInput">Upload from File System</button>
    <div v-if="isCameraOpen">
      <video ref="camera" autoplay playsinline style="width: 200px; height: 200px; object-fit: cover;"></video>
      <button @click="takePhoto">{{ isPhotoTaken ? 'Retake Photo' : 'Take Photo' }}</button>
      <canvas ref="canvas" style="display: none;"></canvas>
    </div>
    <div v-if="imageUrl && !isCameraOpen">
      <img :src="imageUrl" alt="Outfit Image" style="width: 200px; height: 200px; object-fit: cover;">
    </div>
    <button @click="getOutfitRating">Get Rating</button>
    <div>
      <h2>Rating: {{ rating }}</h2>
      <p>Suggestions: {{ suggestions }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import cameraUtils from './camera-utils'; 

export default defineComponent({
  setup() {
    const rating = ref('');
    const suggestions = ref('');
    const imageFile = ref<File | null>(null);
    const imageUrl = ref<string | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const isCameraOpen = ref(false);
    const isPhotoTaken = ref(false);
    const isShotPhoto = ref(false);
    const isLoading = ref(false);

    const onFileChange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0] || null;
      if (file) {
        imageFile.value = file;
        imageUrl.value = URL.createObjectURL(file);
      }
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const toggleCamera = () => {
      if (isCameraOpen.value) {
        isCameraOpen.value = false;
        isPhotoTaken.value = false;
        isShotPhoto.value = false;
        cameraUtils.stopCameraStream();
      } else {
        isCameraOpen.value = true;
        cameraUtils.createCameraElement(isLoading);
      }
    };

    const takePhoto = () => {
      if (isCameraOpen.value && !isPhotoTaken.value) {
        cameraUtils.takePhoto(isPhotoTaken, isShotPhoto, imageFile, imageUrl, isCameraOpen);
      } else {
        isPhotoTaken.value = false;
        isShotPhoto.value = false;
        imageFile.value = null;
        imageUrl.value = null;
      }
    };

    const getOutfitRating = async () => {
      const formData = new FormData();
      if (imageFile.value) {
        formData.append('image', imageFile.value);
      }

      const response = await axios.post('http://localhost:5008/api/rate-outfit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const [ratingText, suggestionText] = response.data.rating.split("Suggestions:");
      rating.value = ratingText.trim();
      suggestions.value = suggestionText.trim();
    };

    return { rating, suggestions, imageUrl, onFileChange, triggerFileInput, toggleCamera, takePhoto, getOutfitRating, fileInput, isCameraOpen, isPhotoTaken, isShotPhoto, isLoading };
  }
});
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
}
button {
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  margin: 10px;
}
img {
  margin: 10px 0;
}
</style>
