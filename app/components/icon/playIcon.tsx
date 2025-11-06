import IconProps from "./types";

export default function PlayIcon({ width = 50, height = 50 }: IconProps) {
  return (
    <svg
      width={width}
      height={width}
      viewBox="0 0 50 50"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(25, 25) scale(2.3) translate(-25, -25)">
        <polygon
          className="fill-accent stroke-accent"
          points="20,16 34,24 20,32"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
