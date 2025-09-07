"use client";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background1">
      {/* <h2 className="text-[var(--)]">Welcome! </h2> */}
      <button
        className="hover:cursor-pointer"
        onClick={() => (window.location.href = "/learn")}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 48 48"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            points="20,16 34,24 20,32"
            fill="var(--middleground1)"
            stroke="var(--middleground1)"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {/* <h2>
        The goal of this app is to help you play what you hear on the piano!
      </h2>
      <h2>
        Press play, hook up a midi device and see how well you can match what is
        heard.
      </h2>
      <h2>Good Luck!</h2> */}
    </div>
  );
}
