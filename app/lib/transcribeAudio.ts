import { Region } from "@/types/transcribe";

type TimeUpdateCallback = (time: number) => void;
type PlaybackEndedCallback = () => void;

export class TranscribePlaybackEngine {
  private audioContext: AudioContext;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private buffer: AudioBuffer;
  private startOffset: number = 0;
  private startContextTime: number = 0;
  private _playbackRate: number = 1.0;
  private _isPlaying: boolean = false;
  private loopRegion: Region | null = null;
  private _isLooping: boolean = false;
  private animationFrameId: number | null = null;
  private onTimeUpdate: TimeUpdateCallback | null = null;
  private onPlaybackEnded: PlaybackEndedCallback | null = null;

  constructor(buffer: AudioBuffer) {
    this.audioContext = new AudioContext();
    this.buffer = buffer;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  get duration(): number {
    return this.buffer.duration;
  }

  setOnTimeUpdate(callback: TimeUpdateCallback): void {
    this.onTimeUpdate = callback;
  }

  setOnPlaybackEnded(callback: PlaybackEndedCallback): void {
    this.onPlaybackEnded = callback;
  }

  play(fromTime?: number): void {
    if (this._isPlaying) {
      this.stopSource();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const offset = fromTime !== undefined ? fromTime : this.startOffset;
    this.startOffset = offset;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this._playbackRate;
    this.source.connect(this.gainNode);

    if (this._isLooping && this.loopRegion) {
      this.source.loop = true;
      this.source.loopStart = this.loopRegion.start;
      this.source.loopEnd = this.loopRegion.end;
      // Clamp offset to within loop region
      const clampedOffset = Math.max(
        this.loopRegion.start,
        Math.min(offset, this.loopRegion.end),
      );
      this.startOffset = clampedOffset;
      this.source.start(0, clampedOffset);
    } else {
      this.source.start(0, offset);
      this.source.onended = () => {
        if (this._isPlaying) {
          this._isPlaying = false;
          this.startOffset = 0;
          this.stopAnimationLoop();
          this.onPlaybackEnded?.();
        }
      };
    }

    this.startContextTime = this.audioContext.currentTime;
    this._isPlaying = true;
    this.startAnimationLoop();
  }

  pause(): void {
    if (!this._isPlaying) return;
    this.startOffset = this.getCurrentTime();
    this.stopSource();
    this._isPlaying = false;
    this.stopAnimationLoop();
  }

  stop(): void {
    this.stopSource();
    this._isPlaying = false;
    this.startOffset = 0;
    this.stopAnimationLoop();
  }

  seek(time: number): void {
    this.startOffset = time;
    if (this._isPlaying) {
      this.play(time);
    }
  }

  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
    if (this.source) {
      // Capture current time before changing rate
      const currentTime = this.getCurrentTime();
      this.startOffset = currentTime;
      this.startContextTime = this.audioContext.currentTime;
      this.source.playbackRate.value = rate;
    }
  }

  setLoopRegion(region: Region | null): void {
    this.loopRegion = region;
    if (this.source && region) {
      this.source.loop = true;
      this.source.loopStart = region.start;
      this.source.loopEnd = region.end;
    } else if (this.source && !region) {
      this.source.loop = false;
    }
  }

  setLooping(enabled: boolean): void {
    this._isLooping = enabled;
    if (this._isPlaying && this.loopRegion) {
      // Restart playback to apply loop change
      const currentTime = this.getCurrentTime();
      this.play(currentTime);
    }
  }

  getCurrentTime(): number {
    if (!this._isPlaying) return this.startOffset;

    const elapsed =
      (this.audioContext.currentTime - this.startContextTime) *
      this._playbackRate;
    let time = this.startOffset + elapsed;

    if (this._isLooping && this.loopRegion) {
      const loopDuration = this.loopRegion.end - this.loopRegion.start;
      if (loopDuration > 0 && time > this.loopRegion.end) {
        time =
          this.loopRegion.start +
          ((time - this.loopRegion.start) % loopDuration);
      }
    }

    return Math.min(time, this.buffer.duration);
  }

  dispose(): void {
    this.stop();
    this.audioContext.close();
  }

  private stopSource(): void {
    if (this.source) {
      this.source.onended = null;
      try {
        this.source.stop();
      } catch {
        // Already stopped
      }
      this.source.disconnect();
      this.source = null;
    }
  }

  private startAnimationLoop(): void {
    this.stopAnimationLoop();
    const tick = () => {
      if (this._isPlaying) {
        this.onTimeUpdate?.(this.getCurrentTime());
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
