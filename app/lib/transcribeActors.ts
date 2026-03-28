import { WaveformPeak } from "@/types/transcribe";
import { WAVEFORM_SAMPLES } from "@/constants/transcribeSettings";

export async function decodeAudioFile(
  file: File,
): Promise<{ audioBuffer: AudioBuffer; fileUrl: string }> {
  const fileUrl = URL.createObjectURL(file);
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();
  return { audioBuffer, fileUrl };
}

export function computeWaveformPeaks(
  audioBuffer: AudioBuffer,
  samples: number = WAVEFORM_SAMPLES,
): WaveformPeak[] {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const peaks: WaveformPeak[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
    let min = 1;
    let max = -1;

    for (let j = start; j < end; j++) {
      const sample = channelData[j];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }

    peaks.push({ min, max });
  }

  return peaks;
}

const RECORDING_PEAKS_SAMPLES = 400;

export interface DecodedRecording {
  peaks: WaveformPeak[];
  duration: number;
  audioBuffer: AudioBuffer;
}

const peaksCache = new Map<string, DecodedRecording>();

export async function decodeRecordingBlob(
  recordingId: string,
  blob: Blob,
): Promise<DecodedRecording> {
  const cached = peaksCache.get(recordingId);
  if (cached) return cached;

  const arrayBuffer = await blob.arrayBuffer();
  // Use OfflineAudioContext to avoid competing for the audio device
  const offlineCtx = new OfflineAudioContext(1, 1, 48000);
  const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

  const peaks = computeWaveformPeaks(audioBuffer, RECORDING_PEAKS_SAMPLES);
  const result = { peaks, duration: audioBuffer.duration, audioBuffer };
  peaksCache.set(recordingId, result);
  return result;
}
