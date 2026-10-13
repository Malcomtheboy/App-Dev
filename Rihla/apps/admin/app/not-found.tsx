import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-5xl font-semibold text-accent">404</p>
      <p className="text-sm text-zinc-500">There is nothing at this address.</p>
      <Link href="/dashboard" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on">
        Back to Overview
      </Link>
    </div>
  );
}
