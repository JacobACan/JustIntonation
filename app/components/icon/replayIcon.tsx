import IconProps from "./types";

export default function ReplayIcon({ width = 50, height = 50 }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 50 50"
      fill="none"
      stroke="var(--middleground1)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 8 A16 16 0 1 1 8 24 A16 16 0 0 1" />
      <polyline points="3,24 14,23 9,18 3,24" />
    </svg>
  );
}
