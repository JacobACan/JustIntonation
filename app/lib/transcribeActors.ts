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
