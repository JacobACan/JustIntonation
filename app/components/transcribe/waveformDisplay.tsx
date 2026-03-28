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
import { Region } from "@/types/transcribe";

const MIN_ZOOM = 1;
const MAX_ZOOM = 50;
const ZOOM_STEP = 0.15;

export default function WaveformDisplay({
  zoom,
  onZoomChange,
  onSeek,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Called on any user-initiated seek so the page can sync the engine. */
  onSeek?: (
    time: number,
    options?: { isSection?: boolean; sectionStart?: number },
  ) => void;
}) {
  const service = useContext(TranscribeMachineContext);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);

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
  const loopRegion = useSelector(service!, (state) => state.context.loopRegion);
  const [selectionRegion, setSelectionRegion] = useState<Region | null>(null);
  const [isDraggingMarker, setIsDraggingMarker] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<number>(0);
  const [cursorStyle, setCursorStyle] = useState<string>("default");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    markerId: string;
  } | null>(null);
  const [renameMarkerId, setRenameMarkerId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Get the visible container width
  const getContainerWidth = useCallback(() => {
    return outerContainerRef.current?.clientWidth ?? 600;
  }, []);

  // The full canvas width is container * zoom
  const getCanvasWidth = useCallback(() => {
    return getContainerWidth() * zoom;
  }, [getContainerWidth, zoom]);

  // Draw static waveform when peaks or zoom change
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || waveformPeaks.length === 0) return;

    const canvasWidth = getCanvasWidth();
    canvas.width = canvasWidth;
    canvas.height = 160;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = "160px";

    drawWaveform(canvas, waveformPeaks);
  }, [waveformPeaks, zoom, getCanvasWidth]);

  // Draw overlay (cursor, markers, regions)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || duration === 0) return;

    const canvasWidth = getCanvasWidth();
    canvas.width = canvasWidth;
    canvas.height = 160;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = "160px";

    drawOverlay(canvas, {
      duration,
      currentTime,
      markers,
      loopRegion,
      selectionRegion,
      selectedMarkerId,
    });
  }, [
    currentTime,
    markers,
    loopRegion,
    selectionRegion,
    selectedMarkerId,
    duration,
    zoom,
    getCanvasWidth,
  ]);

  // Auto-scroll to keep cursor visible during playback
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || duration === 0) return;

    const canvasWidth = getCanvasWidth();
    const cursorX = (currentTime / duration) * canvasWidth;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;
    const margin = container.clientWidth * 0.15;

    if (cursorX < viewLeft + margin) {
      container.scrollLeft = Math.max(0, cursorX - margin);
    } else if (cursorX > viewRight - margin) {
      container.scrollLeft = cursorX - container.clientWidth + margin;
    }
  }, [currentTime, duration, getCanvasWidth]);

  // Get x position relative to the canvas (accounting for scroll)
  const getCanvasX = useCallback((e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    const outer = outerContainerRef.current;
    if (!container || !outer) return 0;
    const rect = outer.getBoundingClientRect();
    return e.clientX - rect.left + container.scrollLeft;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!service || duration === 0) return;

      // Close context menu on any click
      setContextMenu(null);

      const x = getCanvasX(e);
      const canvasWidth = getCanvasWidth();

      // Check if clicking near a marker — select it and start drag
      const nearMarker = findNearestMarker(
        x,
        markers,
        canvasWidth,
        duration,
        MARKER_SNAP_THRESHOLD_PX,
      );

      if (nearMarker) {
        setSelectedMarkerId(nearMarker.id);
        setIsDraggingMarker(nearMarker.id);
        return;
      }

      // Clicking elsewhere deselects marker
      setSelectedMarkerId(null);

      // Start region selection
      const time = xToTime(x, canvasWidth, duration);
      selectionStartRef.current = time;
      setIsSelecting(true);
      setSelectionRegion(null);
    },
    [service, duration, markers, getCanvasX, getCanvasWidth],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (duration === 0) return;
      const x = getCanvasX(e);
      const canvasWidth = getCanvasWidth();
      const time = xToTime(x, canvasWidth, duration);

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
        return;
      }

      // Update cursor based on what's under the mouse
      const nearMarker = findNearestMarker(
        x,
        markers,
        canvasWidth,
        duration,
        MARKER_SNAP_THRESHOLD_PX,
      );
      if (nearMarker) {
        setCursorStyle("ew-resize");
      } else if (
        loopRegion &&
        time >= loopRegion.start &&
        time <= loopRegion.end
      ) {
        setCursorStyle("default");
      } else {
        setCursorStyle("pointer");
      }
    },
    [
      isDraggingMarker,
      isSelecting,
      service,
      duration,
      markers,
      loopRegion,
      getCanvasX,
      getCanvasWidth,
    ],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!service || duration === 0) return;
      const canvasWidth = getCanvasWidth();

      if (isDraggingMarker) {
        setIsDraggingMarker(null);
        return;
      }

      if (isSelecting && selectionRegion) {
        service.send({
          type: TranscribeEvent.SELECT_REGION,
          region: selectionRegion,
        });
        // Seek playhead to start of the dragged region
        service.send({
          type: TranscribeEvent.SEEK,
          time: selectionRegion.start,
        });
        onSeek?.(selectionRegion.start, {
          isSection: true,
          sectionStart: selectionRegion.start,
        });
        setSelectionRegion(null);
        setIsSelecting(false);
        return;
      }

      setIsSelecting(false);
      setSelectionRegion(null);

      // Simple click — seek or select marker section
      const x = getCanvasX(e);
      const time = xToTime(x, canvasWidth, duration);

      if (markers.length > 0) {
        const section = findMarkerSection(time, markers, duration);
        if (section) {
          // Shift+click: extend current loop region to include the clicked section
          if (e.shiftKey && loopRegion) {
            const extendedRegion = {
              start: Math.min(loopRegion.start, section.start),
              end: Math.max(loopRegion.end, section.end),
            };
            service.send({
              type: TranscribeEvent.SELECT_REGION,
              region: extendedRegion,
            });
            service.send({
              type: TranscribeEvent.SEEK,
              time: extendedRegion.start,
            });
            onSeek?.(extendedRegion.start, {
              isSection: true,
              sectionStart: extendedRegion.start,
            });
            return;
          }

          service.send({
            type: TranscribeEvent.SELECT_MARKER_SECTION,
            region: section,
          });
          service.send({ type: TranscribeEvent.SEEK, time: section.start });
          onSeek?.(section.start, {
            isSection: true,
            sectionStart: section.start,
          });
          return;
        }
      }

      // Click inside existing loop region → seek to region start
      if (
        loopRegion &&
        time >= loopRegion.start &&
        time <= loopRegion.end
      ) {
        service.send({ type: TranscribeEvent.SEEK, time: loopRegion.start });
        onSeek?.(loopRegion.start, {
          isSection: true,
          sectionStart: loopRegion.start,
        });
        return;
      }

      service.send({ type: TranscribeEvent.SEEK, time });
      onSeek?.(time);
    },
    [
      service,
      duration,
      isDraggingMarker,
      isSelecting,
      selectionRegion,
      markers,
      loopRegion,
      getCanvasX,
      getCanvasWidth,
      onSeek,
    ],
  );

  // Right-click context menu on markers
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!service || duration === 0) return;
      const x = getCanvasX(e);
      const canvasWidth = getCanvasWidth();

      const nearMarker = findNearestMarker(
        x,
        markers,
        canvasWidth,
        duration,
        MARKER_SNAP_THRESHOLD_PX,
      );

      if (nearMarker) {
        e.preventDefault();
        setSelectedMarkerId(nearMarker.id);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          markerId: nearMarker.id,
        });
      }
    },
    [service, duration, markers, getCanvasX, getCanvasWidth],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!service || !selectedMarkerId) return;
    service.send({ type: TranscribeEvent.DELETE_MARKER, id: selectedMarkerId });
    setSelectedMarkerId(null);
    setContextMenu(null);
  }, [service, selectedMarkerId]);

  const handleStartRename = useCallback(() => {
    if (!contextMenu) return;
    const marker = markers.find((m) => m.id === contextMenu.markerId);
    if (marker) {
      setRenameMarkerId(marker.id);
      setRenameValue(marker.label);
    }
    setContextMenu(null);
  }, [contextMenu, markers]);

  const handleRenameSubmit = useCallback(() => {
    if (!service || !renameMarkerId || !renameValue.trim()) return;
    service.send({
      type: TranscribeEvent.RENAME_MARKER,
      id: renameMarkerId,
      label: renameValue.trim(),
    });
    setRenameMarkerId(null);
    setRenameValue("");
  }, [service, renameMarkerId, renameValue]);

  // Backspace to delete selected marker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (
        (e.code === "Backspace" || e.code === "Delete") &&
        selectedMarkerId &&
        service
      ) {
        e.preventDefault();
        service.send({
          type: TranscribeEvent.DELETE_MARKER,
          id: selectedMarkerId,
        });
        setSelectedMarkerId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedMarkerId, service]);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu]);

  // Zoom with Ctrl/Cmd+scroll wheel, pan with plain scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const container = scrollContainerRef.current;
      if (!container) return;

      // Mouse position relative to the scroll container
      const rect = container.getBoundingClientRect();
      const mouseXInContainer = e.clientX - rect.left;
      // What fraction through the visible area the mouse is
      const mouseXInCanvas = mouseXInContainer + container.scrollLeft;
      const oldCanvasWidth = getCanvasWidth();
      const timeFraction = mouseXInCanvas / oldCanvasWidth;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoom * (1 + delta)),
      );

      onZoomChange(newZoom);

      // After zoom, adjust scroll to keep the same time position under the mouse
      requestAnimationFrame(() => {
        const newCanvasWidth = getContainerWidth() * newZoom;
        const newMouseXInCanvas = timeFraction * newCanvasWidth;
        container.scrollLeft = newMouseXInCanvas - mouseXInContainer;
      });
    },
    [zoom, getCanvasWidth, getContainerWidth],
  );

  const handleZoomIn = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const centerTime =
      (container.scrollLeft + container.clientWidth / 2) / getCanvasWidth();
    const newZoom = Math.min(MAX_ZOOM, zoom * (1 + ZOOM_STEP * 3));
    onZoomChange(newZoom);

    requestAnimationFrame(() => {
      const newCanvasWidth = getContainerWidth() * newZoom;
      container.scrollLeft =
        centerTime * newCanvasWidth - container.clientWidth / 2;
    });
  }, [zoom, getCanvasWidth, getContainerWidth]);

  const handleZoomOut = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const centerTime =
      (container.scrollLeft + container.clientWidth / 2) / getCanvasWidth();
    const newZoom = Math.max(MIN_ZOOM, zoom * (1 - ZOOM_STEP * 3));
    onZoomChange(newZoom);

    requestAnimationFrame(() => {
      const newCanvasWidth = getContainerWidth() * newZoom;
      container.scrollLeft =
        centerTime * newCanvasWidth - container.clientWidth / 2;
    });
  }, [zoom, getCanvasWidth, getContainerWidth]);

  const handleZoomReset = useCallback(() => {
    onZoomChange(1);
    const container = scrollContainerRef.current;
    if (container) container.scrollLeft = 0;
  }, []);

  return (
    <div ref={outerContainerRef} className="flex w-full max-w-3xl flex-col">
      {/* Scrollable waveform container */}
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-b-lg border border-[var(--middleground1)]/10"
        style={{ height: "160px" }}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{ width: `${getCanvasWidth()}px`, height: "160px" }}
        >
          <canvas
            ref={waveformCanvasRef}
            className="absolute top-0 left-0"
            style={{ height: "160px" }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute top-0 left-0"
            style={{ height: "160px", cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            onMouseLeave={() => {
              if (isDraggingMarker) setIsDraggingMarker(null);
              if (isSelecting) {
                setIsSelecting(false);
                setSelectionRegion(null);
              }
            }}
          />
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded border border-[var(--middleground1)]/20 bg-[var(--background2)] py-1 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleStartRename}
            className="flex w-full px-4 py-1.5 text-left text-xs text-[var(--foreground2)] transition-colors hover:bg-[var(--middleground1)]/10"
          >
            Rename
          </button>
          <button
            onClick={handleDeleteSelected}
            className="flex w-full px-4 py-1.5 text-left text-xs text-red-400 transition-colors hover:bg-[var(--middleground1)]/10"
          >
            Delete
          </button>
        </div>
      )}

      {/* Rename input */}
      {renameMarkerId && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--middleground1)]/60">
            Rename:
          </span>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") {
                setRenameMarkerId(null);
                setRenameValue("");
              }
            }}
            onBlur={handleRenameSubmit}
            className="rounded border border-[var(--middleground1)]/30 bg-[var(--background2)] px-2 py-1 text-xs text-[var(--foreground2)] outline-none focus:border-[var(--middleground1)]"
          />
        </div>
      )}
    </div>
  );
}
