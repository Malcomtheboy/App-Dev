"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import type { HadithSection } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, Notice, PageHeader, Spinner } from "@/components/ui";

export default function HadithSectionsPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = use(params);
  const { data, error, loading } = useApi<HadithSection[]>(`/api/hadith/${collection}/sections`);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data || !term) return data ?? [];
    return data.filter((section) => section.title.toLowerCase().includes(term) || String(section.number) === term);
  }, [data, search]);

  const total = data?.reduce((sum, section) => sum + section.hadithCount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content/hadith" className="text-sm text-zinc-500 hover:text-foreground">
          ← Hadith
        </Link>
        <PageHeader
          title={collection.charAt(0).toUpperCase() + collection.slice(1)}
          subtitle={data ? `${data.length} ${data.length === 1 ? "section" : "sections"} · ${total.toLocaleString()} hadith` : undefined}
        />
      </div>

      {loading && <Spinner label="Loading sections (the first load of a collection can take a few seconds)…" />}
      {error && <Notice tone="bad" title="Couldn't load this collection">{error}</Notice>}

      {data && (
        <Card>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sections"
            className="mb-4 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent dark:border-zinc-700"
          />
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {visible.map((section) => (
              <li key={section.number}>
                <Link
                  href={`/content/hadith/${collection}/${section.number}`}
                  className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent"
                >
                  <span>
                    <span className="mr-3 text-zinc-500 tabular-nums">{section.number}</span>
                    {section.title}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">{section.hadithCount} hadith</span>
                </Link>
              </li>
            ))}
            {visible.length === 0 && <li className="py-6 text-center text-sm text-zinc-500">No sections match.</li>}
          </ul>
        </Card>
      )}
    </div>
  );
}
