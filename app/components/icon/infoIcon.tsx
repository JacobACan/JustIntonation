import React, { useState, useRef, useEffect } from "react";

export interface InfoIconProps {
  className?: string;
  title: string;
  description: string;
  side?: "left" | "right";
}

/**
 * InfoIcon Component
 *
 * Displays a clickable/hoverable information icon that shows contextual help
 * in a tooltip-like display. The icon can be positioned on either side of content
 * and provides setting descriptions and help text.
 */
export const InfoIcon = ({
  className,
  title,
  description,
  side = "left",
}: InfoIconProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const iconRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const setShowTooltipDelayed = (show: boolean) => {
    if (show == true) {
      setTimeout(() => setShowTooltip(show), 100);
    } else {
      setShowTooltip(show);
    }
  };

  useEffect(() => {
    if (!showTooltip || !iconRef.current || !tooltipRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = iconRect.top - tooltipRect.height / 2 + iconRect.height / 2;
    let left = 0;

    // Adjust top to keep tooltip within viewport
    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    // Position based on side prop
    if (side === "left") {
      left = iconRect.left - tooltipRect.width - 8;
      // If tooltip goes off-screen to the left, flip to right
      if (left < 10) {
        left = iconRect.right + 8;
      }
    } else {
      left = iconRect.right + 8;
      // If tooltip goes off-screen to the right, flip to left
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = iconRect.left - tooltipRect.width - 8;
      }
    }

    setTooltipPosition({ top, left });
  }, [showTooltip, side]);

  return (
    <>
      <svg
        ref={iconRef}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`inline-block hover:cursor-help ${className || "transition-opacity hover:opacity-70"}`}
        onClick={() => setShowTooltipDelayed(!showTooltip)}
        onMouseEnter={() => setShowTooltipDelayed(true)}
        onMouseLeave={() => setShowTooltipDelayed(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setShowTooltipDelayed(!showTooltip);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Information about ${title}`}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="pointer-events-auto fixed z-50 max-w-xs rounded-md border border-slate-700 bg-slate-900 p-3 text-white shadow-lg"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-1 text-sm font-semibold">{title}</h3>
          <p className="text-xs leading-relaxed text-slate-200">
            {description}
          </p>
        </div>
      )}
    </>
  );
};
