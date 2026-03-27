"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "@xstate/react";
import { TranscribeMachineContext } from "@/components/providers/transcribeProvider";
import { TranscribeEvent } from "@/machines/transcribeProcess";
import {
  drawWaveform,
  drawOverlay,
  xToTime,
  findNearestMarker,
  findMarkerSection,
} from "@/lib/waveformRenderer";
import { MARKER_SNAP_THRESHOLD_PX } from "@/constants/transcribeSettings";
import { Marker, Region } from "@/types/transcribe";

export default function WaveformDisplay() {
  const service = useContext(TranscribeMachineContext);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const waveformPeaks = useSelector(
    service!,
    (state) => state.context.waveformPeaks,
  );
  const duration = useSelector(service!, (state) => state.context.duration);
  const currentTime = useSelector(
    service!,
    (state) => state.context.currentTime,
  );
  const markers = useSelector(service!, (state) => state.context.markers);
  const loopRegion = useSelector(
    service!,
    (state) => state.context.loopRegion,
  );

  const [selectionRegion, setSelectionRegion] = useState<Region | null>(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<number>(0);

  // Draw static waveform when peaks change
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || waveformPeaks.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = 160 * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "160px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Reset scale for drawWaveform since it works with canvas dimensions
    canvas.width = rect.width;
    canvas.height = 160;

    drawWaveform(canvas, waveformPeaks);
  }, [waveformPeaks]);

  // Draw overlay (cursor, markers, regions) on animation frame
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || duration === 0) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 160;

    drawOverlay(canvas, {
      duration,
      currentTime,
      markers,
      loopRegion,
      selectionRegion,
    });
  }, [currentTime, markers, loopRegion, selectionRegion, duration]);

  const getCanvasX = useCallback(
    (e: React.MouseEvent) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return 0;
      const rect = canvas.getBoundingClientRect();
      return e.clientX - rect.left;
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!service || duration === 0) return;
      const x = getCanvasX(e);
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      // Check if clicking near a marker to drag it
      const nearMarker = findNearestMarker(
        x,
        markers,
        canvas.width,
        duration,
        MARKER_SNAP_THRESHOLD_PX,
      );

      if (nearMarker) {
        setIsDraggingMarker(nearMarker.id);
        return;
      }

      // Start region selection
      const time = xToTime(x, canvas.width, duration);
      selectionStartRef.current = time;
      setIsSelecting(true);
      setSelectionRegion(null);
    },
    [service, duration, markers, getCanvasX],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas || duration === 0) return;
      const x = getCanvasX(e);
      const time = xToTime(x, canvas.width, duration);

      if (isDraggingMarker && service) {
        service.send({
          type: TranscribeEvent.MOVE_MARKER,
          id: isDraggingMarker,
          time,
        });
        return;
      }

      if (isSelecting) {
        const start = Math.min(selectionStartRef.current, time);
        const end = Math.max(selectionStartRef.current, time);
        if (Math.abs(end - start) > 0.05) {
          setSelectionRegion({ start, end });
        }
      }
    },
    [isDraggingMarker, isSelecting, service, duration, getCanvasX],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!service || duration === 0) return;
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      if (isDraggingMarker) {
        setIsDraggingMarker(null);
        return;
      }

      if (isSelecting && selectionRegion) {
        // Set loop region from selection
        service.send({
          type: TranscribeEvent.SELECT_REGION,
          region: selectionRegion,
        });
        setSelectionRegion(null);
        setIsSelecting(false);
        return;
      }

      setIsSelecting(false);
      setSelectionRegion(null);

      // Simple click — seek or select marker section
      const x = getCanvasX(e);
      const time = xToTime(x, canvas.width, duration);

      if (markers.length > 0) {
        const section = findMarkerSection(time, markers, duration);
        if (section) {
          service.send({
            type: TranscribeEvent.SELECT_MARKER_SECTION,
            region: section,
          });
        }
      }

      service.send({ type: TranscribeEvent.SEEK, time });
    },
    [
      service,
      duration,
      isDraggingMarker,
      isSelecting,
      selectionRegion,
      markers,
      getCanvasX,
    ],
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl">
      <canvas
        ref={waveformCanvasRef}
        className="w-full rounded-lg"
        style={{ height: "160px" }}
      />
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full cursor-crosshair rounded-lg"
        style={{ height: "160px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDraggingMarker) setIsDraggingMarker(null);
          if (isSelecting) {
            setIsSelecting(false);
            setSelectionRegion(null);
          }
        }}
      />
    </div>
  );
}
