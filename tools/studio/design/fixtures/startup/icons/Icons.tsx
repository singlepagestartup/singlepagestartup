import { useState } from "react";

export default function Icons() {
  const [size, setSize] = useState("small");
  return (
    <div className="space-y-5 rounded-2xl bg-white p-6">
      <p>Reusable icons with project-specific size and spacing.</p>
      <button
        type="button"
        className="rounded-lg bg-indigo-700 px-4 py-2 text-white"
        onClick={() => setSize(size === "small" ? "large" : "small")}
      >
        Change icon size
      </button>
      <div className="flex items-center gap-6">
        <svg
          aria-label={`Check icon ${size}`}
          className={size === "small" ? "size-8" : "size-16"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
        <span>{size === "small" ? "Small icons" : "Large icons"}</span>
      </div>
    </div>
  );
}
