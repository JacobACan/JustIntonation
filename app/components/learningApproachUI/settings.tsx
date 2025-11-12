import React from "react";

export default function Settings({
  children,
}: {
  children: React.ReactNode[];
}) {
  return (
    <div className="pointer-events-auto text-sm">
      {children.map((child, i) => (
        <div key={i} className="border-primary/50 m-2 rounded-sm border-2 p-2">
          {child}
        </div>
      ))}
    </div>
  );
}
