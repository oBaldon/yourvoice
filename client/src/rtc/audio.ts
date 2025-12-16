// client/src/rtc/audio.ts
export async function getMicStream(aec: boolean) {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: aec,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: false
  });
}
