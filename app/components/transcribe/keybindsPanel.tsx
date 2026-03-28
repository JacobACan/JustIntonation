"use client";

const KEYBIND_GROUPS = [
  {
    label: "Playback",
    binds: [
      { keys: "Space", description: "Play / Pause both tracks (snaps back)" },
      { keys: "Hold 1", description: "Play reference track only" },
      { keys: "Hold 2", description: "Play transcription only" },
      { keys: "Hold 1+2", description: "Play both tracks" },
      { keys: "K", description: "Stop and reset speed to 1x" },
    ],
  },
  {
    label: "Speed",
    binds: [
      { keys: "J", description: "Slow down playback" },
      { keys: "L", description: "Speed up playback" },
    ],
  },
  {
    label: "Navigation",
    binds: [
      { keys: "Shift + ←", description: "Previous section" },
      { keys: "Shift + →", description: "Next section" },
      { keys: "Ctrl + ←", description: "Nudge playhead back" },
      { keys: "Ctrl + →", description: "Nudge playhead forward" },
    ],
  },
  {
    label: "Editing",
    binds: [
      { keys: "T", description: "Start / Stop transcribing" },
      { keys: "M", description: "Drop marker at playhead" },
      { keys: "Escape", description: "Clear loop region" },
      { keys: "Ctrl + Scroll", description: "Zoom waveform in / out" },
    ],
  },
];

export default function KeybindsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <section
      className={`fixed top-0 right-0 z-30 h-full w-[280px] transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Gradient fade on left edge */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent" />

      <div className="bg-background relative z-20 flex h-full flex-col overflow-y-auto border-l border-[var(--middleground1)]/10 px-6 pt-16">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-xs text-[var(--middleground1)]/50 transition-colors hover:cursor-pointer hover:text-[var(--middleground1)]"
          aria-label="Close keybinds panel"
        >
          x
        </button>

        <h2 className="mb-6 text-sm font-bold text-[var(--foreground2)]">
          Keybinds
        </h2>

        <div className="flex flex-col gap-6">
          {KEYBIND_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 text-xs font-bold text-[var(--middleground1)]/40 uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="flex flex-col gap-3">
                {group.binds.map((bind) => (
                  <div
                    key={bind.keys}
                    className="flex items-start justify-between gap-4"
                  >
                    <kbd className="shrink-0 rounded border border-[var(--middleground1)]/20 bg-[var(--background2)] px-2 py-0.5 text-xs text-[var(--foreground2)]">
                      {bind.keys}
                    </kbd>
                    <span className="text-right text-xs text-[var(--middleground1)]/70">
                      {bind.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
