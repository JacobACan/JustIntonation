"use client";

const KEYBINDS = [
  { keys: "Space", description: "Play / Pause" },
  { keys: "M", description: "Drop marker at playhead" },
  { keys: "Escape", description: "Clear loop region" },
  { keys: "Ctrl + ←", description: "Nudge playhead back 5s" },
  { keys: "Ctrl + →", description: "Nudge playhead forward 5s" },
  { keys: "Ctrl + Scroll", description: "Zoom waveform in / out" },
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

        <div className="flex flex-col gap-4">
          {KEYBINDS.map((bind) => (
            <div key={bind.keys} className="flex items-start justify-between gap-4">
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
    </section>
  );
}
