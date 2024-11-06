export const createCameraElement = async (isLoading: any) => {
  isLoading.value = true;
  const constraints = { audio: false, video: true };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    isLoading.value = false;
    (document.querySelector('video') as HTMLVideoElement).srcObject = stream;
  } catch (error) {
    isLoading.value = false;
    alert("The browser may not support camera access or an error occurred.");
  }
};

export const stopCameraStream = () => {
  const tracks = ((document.querySelector('video') as HTMLVideoElement).srcObject as MediaStream)?.getTracks();
  tracks?.forEach(track => track.stop());
};

export const takePhoto = (isPhotoTaken: any, isShotPhoto: any, imageFile: any, imageUrl: any, isCameraOpen: any) => {
  if (!isPhotoTaken.value) {
    isShotPhoto.value = true;
    setTimeout(() => {
      isShotPhoto.value = false;
    }, 50);
  }

  isPhotoTaken.value = !isPhotoTaken.value;
  const canvas = document.querySelector('canvas') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  const video = document.querySelector('video') as HTMLVideoElement;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context?.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    if (blob) {
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      imageFile.value = file;
      imageUrl.value = URL.createObjectURL(file);
      isCameraOpen.value = false;
      stopCameraStream();
    }
  });
};

export default {
  createCameraElement,
  stopCameraStream,
  takePhoto
};