"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="text-sm text-zinc-500">This page hit an unexpected problem. Trying again usually fixes it.</p>
      <button onClick={reset} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on">
        Try again
      </button>
    </div>
  );
}
