import { Marker, Region, WaveformPeak } from "@/types/transcribe";

const WAVEFORM_COLOR = "#deb887";
const CURSOR_COLOR = "#fff5e1";
const LOOP_REGION_COLOR = "rgba(222, 184, 135, 0.2)";
const LOOP_BORDER_COLOR = "rgba(222, 184, 135, 0.6)";
const MARKER_COLOR = "#fff5e1";
const MARKER_LABEL_BG = "rgba(30, 30, 30, 0.8)";
const SELECTION_COLOR = "rgba(222, 184, 135, 0.15)";

export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: WaveformPeak[],
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  const centerY = height / 2;
  const barWidth = width / peaks.length;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = WAVEFORM_COLOR;

  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    const x = i * barWidth;
    const minY = centerY + peak.min * centerY;
    const maxY = centerY + peak.max * centerY;
    const barHeight = Math.max(maxY - minY, 1);
    ctx.fillRect(x, minY, Math.max(barWidth - 0.5, 1), barHeight);
  }
}

export function drawOverlay(
  canvas: HTMLCanvasElement,
  opts: {
    duration: number;
    currentTime: number;
    markers: Marker[];
    loopRegion: Region | null;
    selectionRegion: Region | null;
  },
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const timeToX = (time: number) => (time / opts.duration) * width;

  // Draw loop region
  if (opts.loopRegion) {
    const startX = timeToX(opts.loopRegion.start);
    const endX = timeToX(opts.loopRegion.end);
    ctx.fillStyle = LOOP_REGION_COLOR;
    ctx.fillRect(startX, 0, endX - startX, height);
    ctx.strokeStyle = LOOP_BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  }

  // Draw selection region (during drag)
  if (opts.selectionRegion) {
    const startX = timeToX(opts.selectionRegion.start);
    const endX = timeToX(opts.selectionRegion.end);
    ctx.fillStyle = SELECTION_COLOR;
    ctx.fillRect(startX, 0, endX - startX, height);
  }

  // Draw markers
  for (const marker of opts.markers) {
    const x = timeToX(marker.time);
    ctx.strokeStyle = MARKER_COLOR;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Marker label
    const label = marker.label;
    ctx.font = "11px M PLUS 1 Code, monospace";
    const textWidth = ctx.measureText(label).width;
    const padding = 4;
    const labelWidth = textWidth + padding * 2;
    const labelHeight = 18;
    const labelX = Math.min(x - labelWidth / 2, width - labelWidth);
    const clampedLabelX = Math.max(0, labelX);

    ctx.fillStyle = MARKER_LABEL_BG;
    ctx.fillRect(clampedLabelX, 2, labelWidth, labelHeight);
    ctx.fillStyle = MARKER_COLOR;
    ctx.fillText(label, clampedLabelX + padding, 14);
  }

  // Draw cursor
  const cursorX = timeToX(opts.currentTime);
  ctx.strokeStyle = CURSOR_COLOR;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, height);
  ctx.stroke();
}

export function xToTime(
  x: number,
  canvasWidth: number,
  duration: number,
): number {
  return Math.max(0, Math.min((x / canvasWidth) * duration, duration));
}

export function findNearestMarker(
  x: number,
  markers: Marker[],
  canvasWidth: number,
  duration: number,
  threshold: number,
): Marker | null {
  let nearest: Marker | null = null;
  let minDistance = Infinity;

  for (const marker of markers) {
    const markerX = (marker.time / duration) * canvasWidth;
    const distance = Math.abs(x - markerX);
    if (distance < threshold && distance < minDistance) {
      minDistance = distance;
      nearest = marker;
    }
  }

  return nearest;
}

export function findMarkerSection(
  time: number,
  markers: Marker[],
  duration: number,
): Region | null {
  if (markers.length === 0) return null;

  const sorted = [...markers].sort((a, b) => a.time - b.time);

  // Before first marker
  if (time < sorted[0].time) {
    return { start: 0, end: sorted[0].time };
  }

  // After last marker
  if (time > sorted[sorted.length - 1].time) {
    return { start: sorted[sorted.length - 1].time, end: duration };
  }

  // Between markers
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      return { start: sorted[i].time, end: sorted[i + 1].time };
    }
  }

  return null;
}
