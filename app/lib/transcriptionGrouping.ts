import { Marker, Recording, Region, SectionGroup } from "@/types/transcribe";

const TOLERANCE = 0.5; // seconds

function regionsMatch(a: Region, b: Region): boolean {
  return (
    Math.abs(a.start - b.start) <= TOLERANCE &&
    Math.abs(a.end - b.end) <= TOLERANCE
  );
}

export function groupRecordingsBySections(
  recordings: Recording[],
  markers: Marker[],
  duration: number,
): SectionGroup[] {
  // Build sections from consecutive markers
  const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);
  const boundaries = [0, ...sortedMarkers.map((m) => m.time), duration];
  const sections: { label: string; region: Region }[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end - start < 0.01) continue;

    const startLabel =
      i === 0
        ? "Start"
        : sortedMarkers[i - 1]?.label ?? `${formatTime(start)}`;
    const endLabel =
      i === boundaries.length - 2
        ? "End"
        : sortedMarkers[i]?.label ?? `${formatTime(end)}`;

    sections.push({
      label: `${startLabel} — ${endLabel}`,
      region: { start, end },
    });
  }

  // Group recordings into sections
  const groups: Map<number, Recording[]> = new Map();
  const fullTrack: Recording[] = [];
  const ungrouped: Recording[] = [];

  for (const recording of recordings) {
    if (!recording.region) {
      fullTrack.push(recording);
      continue;
    }

    let matched = false;
    for (let i = 0; i < sections.length; i++) {
      if (regionsMatch(recording.region, sections[i].region)) {
        if (!groups.has(i)) groups.set(i, []);
        groups.get(i)!.push(recording);
        matched = true;
        break;
      }
    }

    if (!matched) {
      ungrouped.push(recording);
    }
  }

  // Build result — only sections with recordings
  const result: SectionGroup[] = [];

  for (let i = 0; i < sections.length; i++) {
    const recs = groups.get(i);
    if (recs && recs.length > 0) {
      result.push({
        label: sections[i].label,
        region: sections[i].region,
        recordings: recs.sort((a, b) => b.createdAt - a.createdAt),
      });
    }
  }

  if (fullTrack.length > 0) {
    result.push({
      label: "Full Track",
      region: { start: 0, end: duration },
      recordings: fullTrack.sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  if (ungrouped.length > 0) {
    result.push({
      label: "Ungrouped",
      region: { start: 0, end: duration },
      recordings: ungrouped.sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  return result;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getSectionLabel(
  region: Region,
  markers: Marker[],
  duration: number,
): string {
  const sorted = [...markers].sort((a, b) => a.time - b.time);
  const boundaries = [0, ...sorted.map((m) => m.time), duration];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (
      Math.abs(region.start - start) <= TOLERANCE &&
      Math.abs(region.end - end) <= TOLERANCE
    ) {
      const startLabel =
        i === 0 ? "Start" : sorted[i - 1]?.label ?? formatTime(start);
      const endLabel =
        i === boundaries.length - 2
          ? "End"
          : sorted[i]?.label ?? formatTime(end);
      return `${startLabel} — ${endLabel}`;
    }
  }

  // No exact section match — show time range
  return `${formatTime(region.start)} — ${formatTime(region.end)}`;
}
