import IconProps from "./types";

export default function PlayIcon({ width = 50, height = 50 }: IconProps) {
  return (
    <svg
      width={width}
      height={width}
      viewBox="0 0 50 50"
      fill="none"
      stroke="var(--middleground1)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(25, 25) scale(2.3) translate(-25, -25)">
        <polygon
          points="20,16 34,24 20,32"
          fill="var(--middleground1)"
          stroke="var(--middleground1)"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
