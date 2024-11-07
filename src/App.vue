<template>
  <div id="app">
    <h1>Check My Fit</h1>
    <p>Rate your outfit and style with AI and get suggestions</p>
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
    <div>
      <label for="occasion">Occasion-Based Suggestions: </label>
      <select v-model="selectedOccasion" id="occasion">
        <option value="">Select Occasion</option>
        <option value="Casual">Casual</option>
        <option value="Formal">Formal</option>
        <option value="Date Night">Date Night</option>
        <!-- Add more options as needed -->
      </select>
    </div>
    <div>
      <button @click="getOutfitRating">Check Fit</button>
    </div>
    <!-- Output the rating and analysis -->
    <div v-if="rating">
      <h1 class="rating">{{ rating }}/10</h1>
      <div>
        <h3>Outfit Description:</h3>
        <p>{{ outfitDescription }}</p>
      </div>
      <div>
        <label>
          <input type="radio" v-model="analysisType" value="quick" /> Quick Tip
        </label>
        <label>
          <input type="radio" v-model="analysisType" value="detailed" /> Detailed Analysis
        </label>
      </div>
      <div v-if="analysisType === 'quick' && quickTips.length">
        <h3>Quick Tips:</h3>
        <ul>
          <li v-for="tip in quickTips" :key="tip">{{ tip }}</li>
        </ul>
      </div>
      <div v-if="analysisType === 'detailed' && detailedAnalysis">
        <h3>Detailed Analysis:</h3>
        <p><strong>Color:</strong> {{ detailedAnalysis.color }}</p>
        <p><strong>Fit:</strong> {{ detailedAnalysis.fit }}</p>
        <p><strong>Accessories:</strong> {{ detailedAnalysis.accessories }}</p>
      </div>
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
    const quickTips = ref<string[]>([]);
    const detailedAnalysis = ref<{ color: string, fit: string, accessories: string } | null>(null);
    const outfitDescription = ref(''); // New ref for outfit description
    const imageFile = ref<File | null>(null);
    const imageUrl = ref<string | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const isCameraOpen = ref(false);
    const isPhotoTaken = ref(false);
    const isShotPhoto = ref(false);
    const isLoading = ref(false);
    const analysisType = ref('quick'); // New ref for analysis type
    const lastImageFile = ref<File | null>(null); // New ref to store the last uploaded image
    const lastOccasion = ref(''); // New ref to store the last selected occasion
    const selectedOccasion = ref(''); // New ref for selected occasion

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
      if (rating.value && imageFile.value === lastImageFile.value && selectedOccasion.value === lastOccasion.value) {
        console.log("Image and occasion did not change, not triggering another rating.");
        return;
      }

      const formData = new FormData();
      if (imageFile.value) {
        formData.append('image', imageFile.value);
        formData.append('occasion', selectedOccasion.value); // Include occasion in the form data
        lastImageFile.value = imageFile.value; // Update the last uploaded image
        lastOccasion.value = selectedOccasion.value; // Update the last selected occasion
      }

      const response = await axios.post('http://localhost:5008/api/rate-outfit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;
      console.log("API Response:", data);
      rating.value = data.rating;
      outfitDescription.value = data.description; // Set the outfit description
      if (data.quick_tips) {
        quickTips.value = data.quick_tips;
      }
      if (data.detailed_analysis) {
        detailedAnalysis.value = data.detailed_analysis;
      }
    };

    return { rating, quickTips, detailedAnalysis, outfitDescription, imageUrl, onFileChange, triggerFileInput, toggleCamera, takePhoto, getOutfitRating, fileInput, isCameraOpen, isPhotoTaken, isShotPhoto, isLoading, analysisType, selectedOccasion };
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
.rating {
  font-size: 4em;
  font-weight: bold;
  color: #ff6347; /* Tomato color for emphasis */
}
</style>
