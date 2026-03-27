import { Region } from "@/types/transcribe";

type TimeUpdateCallback = (time: number) => void;
type PlaybackEndedCallback = () => void;

export class TranscribePlaybackEngine {
  private audio: HTMLAudioElement;
  private _isPlaying: boolean = false;
  private loopRegion: Region | null = null;
  private _isLooping: boolean = false;
  private animationFrameId: number | null = null;
  private onTimeUpdateCb: TimeUpdateCallback | null = null;
  private onPlaybackEndedCb: PlaybackEndedCallback | null = null;

  constructor(fileUrl: string) {
    this.audio = new Audio(fileUrl);
    this.audio.preservesPitch = true;

    this.audio.addEventListener("ended", () => {
      this._isPlaying = false;
      this.stopAnimationLoop();
      this.onPlaybackEndedCb?.();
    });
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get playbackRate(): number {
    return this.audio.playbackRate;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  setOnTimeUpdate(callback: TimeUpdateCallback): void {
    this.onTimeUpdateCb = callback;
  }

  setOnPlaybackEnded(callback: PlaybackEndedCallback): void {
    this.onPlaybackEndedCb = callback;
  }

  play(fromTime?: number): void {
    // Always pause first to ensure clean state — prevents promise races
    this.audio.pause();

    if (fromTime !== undefined) {
      this.audio.currentTime = fromTime;
    }

    // If looping, always start from loop region beginning
    if (this._isLooping && this.loopRegion) {
      this.audio.currentTime = this.loopRegion.start;
    }

    this._isPlaying = true;
    this.startAnimationLoop();
    // Fire-and-forget — AbortError from a future pause() is harmless
    this.audio.play().catch(() => {});
  }

  pause(): void {
    this._isPlaying = false;
    this.stopAnimationLoop();
    this.audio.pause();
  }

  stop(): void {
    this._isPlaying = false;
    this.stopAnimationLoop();
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  seek(time: number): void {
    this.audio.currentTime = time;
  }

  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
  }

  setLoopRegion(region: Region | null): void {
    this.loopRegion = region;
  }

  setLooping(enabled: boolean): void {
    this._isLooping = enabled;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  dispose(): void {
    this._isPlaying = false;
    this.stopAnimationLoop();
    this.audio.pause();
    this.audio.src = "";
    this.audio.load();
  }

  private startAnimationLoop(): void {
    this.stopAnimationLoop();
    const tick = () => {
      if (!this._isPlaying) return;

      // Handle loop boundary
      if (this._isLooping && this.loopRegion) {
        if (this.audio.currentTime >= this.loopRegion.end) {
          this.audio.currentTime = this.loopRegion.start;
        }
      }

      this.onTimeUpdateCb?.(this.audio.currentTime);
      this.animationFrameId = requestAnimationFrame(tick);
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
