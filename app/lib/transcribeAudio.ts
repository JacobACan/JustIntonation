import { Region } from "@/types/transcribe";
import { SoundTouchNode } from "@soundtouchjs/audio-worklet";

/**
 * DualTrackAudioEngine — manages synchronized playback of reference + transcription
 * audio on a single AudioContext for zero-drift sync.
 *
 * Architecture per track:
 *   AudioBufferSourceNode (playbackRate = speed)
 *     → SoundTouchNode (pitch = 1/speed for pitch preservation)
 *     → GainNode (muting)
 *     → AudioContext.destination
 *
 * AudioBufferSourceNodes are one-shot — seeking requires stopping the current
 * source and creating a new one at the desired offset.
 *
 * Position tracking:
 *   position = startOffset + (audioContext.currentTime - contextStartTime) * playbackRate
 */

interface TrackState {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  soundTouch: SoundTouchNode;
  gain: GainNode;
  /** audioContext.currentTime when the source was started */
  contextStartTime: number;
  /** offset into the buffer where playback started (seconds) */
  startOffset: number;
  /** true if this track has an active, playing source */
  playing: boolean;
}

export class DualTrackAudioEngine {
  private ctx: AudioContext;
  private ref: TrackState;
  private trans: TrackState;
  private _playbackRate: number = 1;
  private _transposeSemitones: number = 0;
  private _transTransposeSemitones: number = 0;
  private _disposed: boolean = false;

  private constructor(
    ctx: AudioContext,
    refBuffer: AudioBuffer,
    refST: SoundTouchNode,
    transST: SoundTouchNode,
  ) {
    this.ctx = ctx;

    const refGain = ctx.createGain();
    refGain.connect(ctx.destination);
    refST.connect(refGain);

    const transGain = ctx.createGain();
    transGain.connect(ctx.destination);
    transST.connect(transGain);

    this.ref = {
      buffer: refBuffer,
      source: null,
      soundTouch: refST,
      gain: refGain,
      contextStartTime: 0,
      startOffset: 0,
      playing: false,
    };

    this.trans = {
      buffer: null,
      source: null,
      soundTouch: transST,
      gain: transGain,
      contextStartTime: 0,
      startOffset: 0,
      playing: false,
    };
  }

  /**
   * Create and initialize the engine. Registers the SoundTouch AudioWorklet
   * processor and sets up the audio graph.
   */
  static async create(refBuffer: AudioBuffer): Promise<DualTrackAudioEngine> {
    const ctx = new AudioContext();
    await SoundTouchNode.register(ctx, "/soundtouch-processor.js");
    const refST = new SoundTouchNode(ctx);
    const transST = new SoundTouchNode(ctx);
    return new DualTrackAudioEngine(ctx, refBuffer, refST, transST);
  }

  // ── Reference track ──────────────────────────────────────────────────

  playRef(fromTime: number): void {
    this.stopRefSource();
    this.startSource(this.ref, fromTime);
  }

  stopRef(): void {
    this.stopRefSource();
  }

  seekRef(time: number): void {
    if (this.ref.playing) {
      // Seamless seek during playback: stop and restart at new position
      this.stopRefSource();
      this.startSource(this.ref, time);
    } else {
      this.ref.startOffset = time;
    }
  }

  getCurrentRefTime(): number {
    return this.getTrackTime(this.ref);
  }

  getRefDuration(): number {
    return this.ref.buffer?.duration ?? 0;
  }

  muteRef(muted: boolean): void {
    this.ref.gain.gain.value = muted ? 0 : 1;
  }

  setRefVolume(volume: number): void {
    this.ref.gain.gain.value = Math.max(0, Math.min(1, volume));
  }

  // ── Transcription track ──────────────────────────────────────────────

  loadTranscription(buffer: AudioBuffer): void {
    this.stopTransSource();
    this.trans.buffer = buffer;
  }

  unloadTranscription(): void {
    this.stopTransSource();
    this.trans.buffer = null;
  }

  hasTranscription(): boolean {
    return this.trans.buffer !== null;
  }

  playTrans(fromTime: number): void {
    if (!this.trans.buffer) return;
    this.stopTransSource();
    this.startSource(this.trans, fromTime);
  }

  stopTrans(): void {
    this.stopTransSource();
  }

  seekTrans(time: number): void {
    if (!this.trans.buffer) return;
    if (this.trans.playing) {
      this.stopTransSource();
      this.startSource(this.trans, time);
    } else {
      this.trans.startOffset = time;
    }
  }

  getCurrentTransTime(): number {
    return this.getTrackTime(this.trans);
  }

  getTransDuration(): number {
    return this.trans.buffer?.duration ?? 0;
  }

  muteTrans(muted: boolean): void {
    this.trans.gain.gain.value = muted ? 0 : 1;
  }

  // ── Shared ───────────────────────────────────────────────────────────

  get isRefPlaying(): boolean {
    return this.ref.playing;
  }

  get isTransPlaying(): boolean {
    return this.trans.playing;
  }

  setRate(rate: number): void {
    this._playbackRate = rate;
    this.applyPitch();

    // Seamlessly update playing sources at new rate
    if (this.ref.source && this.ref.playing) {
      const currentTime = this.getTrackTime(this.ref);
      this.stopRefSource();
      this.startSource(this.ref, currentTime);
    }

    if (this.trans.source && this.trans.playing) {
      const currentTime = this.getTrackTime(this.trans);
      this.stopTransSource();
      this.startSource(this.trans, currentTime);
    }
  }

  setTranspose(semitones: number): void {
    this._transposeSemitones = semitones;
    this.applyPitch();
  }

  get transpose(): number {
    return this._transposeSemitones;
  }

  /**
   * Set the transpose offset for the transcription track independently.
   * This is the delta: currentTranspose - recordedTranspose.
   */
  setTransTranspose(semitones: number): void {
    this._transTransposeSemitones = semitones;
    this.applyPitch();
  }

  /** Recompute SoundTouch pitch per track: rate correction * transpose shift */
  private applyPitch(): void {
    const pitchCorrection = 1 / this._playbackRate;
    const refShift = Math.pow(2, this._transposeSemitones / 12);
    this.ref.soundTouch.pitch.value = pitchCorrection * refShift;
    const transShift = Math.pow(2, this._transTransposeSemitones / 12);
    this.trans.soundTouch.pitch.value = pitchCorrection * transShift;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.stopRefSource();
    this.stopTransSource();
    this.ref.soundTouch.disconnect();
    this.trans.soundTouch.disconnect();
    this.ref.gain.disconnect();
    this.trans.gain.disconnect();
    this.ctx.close().catch(() => {});
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private startSource(track: TrackState, fromTime: number): void {
    if (!track.buffer || this._disposed) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const source = this.ctx.createBufferSource();
    source.buffer = track.buffer;
    source.playbackRate.value = this._playbackRate;
    source.connect(track.soundTouch);

    // Clamp offset to valid range
    const offset = Math.max(0, Math.min(fromTime, track.buffer.duration));

    track.source = source;
    track.contextStartTime = this.ctx.currentTime;
    track.startOffset = offset;
    track.playing = true;

    // Handle natural end of buffer
    source.onended = () => {
      if (track.source === source) {
        track.playing = false;
        track.source = null;
      }
    };

    source.start(0, offset);
  }

  private stopRefSource(): void {
    this.stopSource(this.ref);
  }

  private stopTransSource(): void {
    this.stopSource(this.trans);
  }

  private stopSource(track: TrackState): void {
    if (track.source) {
      // Record final position before stopping
      if (track.playing) {
        track.startOffset = this.getTrackTime(track);
      }
      track.source.onended = null;
      try {
        track.source.stop();
      } catch {
        // Already stopped
      }
      track.source.disconnect();
      track.source = null;
    }
    track.playing = false;
  }

  private getTrackTime(track: TrackState): number {
    if (!track.buffer) return 0;
    if (!track.playing) return track.startOffset;

    const elapsed = this.ctx.currentTime - track.contextStartTime;
    const position = track.startOffset + elapsed * this._playbackRate;
    return Math.min(position, track.buffer.duration);
  }
}
