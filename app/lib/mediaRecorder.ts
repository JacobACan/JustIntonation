import { Recording, Region } from "@/types/transcribe";

/**
 * Pad a recorded audio blob with silence so its duration matches the target.
 * Returns a new blob if padding was needed, or the original if already long enough.
 */
export async function padRecordingToLength(
  blob: Blob,
  targetDuration: number,
): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const offlineCtx = new OfflineAudioContext(1, 1, 48000);
  let decoded: AudioBuffer;
  try {
    decoded = await offlineCtx.decodeAudioData(arrayBuffer);
  } catch {
    return blob; // can't decode — return as-is
  }

  if (decoded.duration >= targetDuration) return blob;

  // Create a new buffer of the target length, copy the recording into it
  const sampleRate = decoded.sampleRate;
  const channels = decoded.numberOfChannels;
  const targetFrames = Math.ceil(targetDuration * sampleRate);
  const padCtx = new OfflineAudioContext(channels, targetFrames, sampleRate);

  const source = padCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(padCtx.destination);
  source.start(0);

  const rendered = await padCtx.startRendering();

  // Encode back to WAV (simple, lossless, no codec issues)
  const wav = audioBufferToWav(rendered);
  return new Blob([wav], { type: "audio/wav" });
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const dataSize = length * numChannels * bytesPerSample;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++)
      view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, headerSize - 8 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels and write 16-bit samples
  let offset = headerSize;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private _stream: MediaStream | null = null;
  private startTime: number = 0;

  get stream(): MediaStream | null {
    return this._stream;
  }

  async requestPermission(): Promise<boolean> {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  start(): void {
    if (!this._stream) return;

    this.chunks = [];
    this.startTime = Date.now();

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    this.mediaRecorder = new MediaRecorder(this._stream, {
      mimeType,
      audioBitsPerSecond: 128000,
    });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };
    this.mediaRecorder.start(1000);
  }

  stop(region: Region | null): Promise<Recording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No active recording"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });
        const objectUrl = URL.createObjectURL(blob);
        const duration = (Date.now() - this.startTime) / 1000;

        resolve({
          id: crypto.randomUUID(),
          blob,
          objectUrl,
          createdAt: Date.now(),
          region,
          duration,
        });
      };

      this.mediaRecorder.stop();
    });
  }

  dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }
  }
}
