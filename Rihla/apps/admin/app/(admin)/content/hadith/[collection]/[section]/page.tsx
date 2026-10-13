"use client";

import Link from "next/link";
import { use, useState } from "react";
import type { HadithEntry } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, Notice, PageHeader, Pill, Spinner } from "@/components/ui";

type SectionPayload = { number: number; title: string; hadiths: HadithEntry[] };

const PAGE_SIZE = 50;

export default function HadithSectionPage({ params }: { params: Promise<{ collection: string; section: string }> }) {
  const { collection, section } = use(params);
  const { data, error, loading } = useApi<SectionPayload>(`/api/hadith/${collection}/sections/${section}`);
  const [shown, setShown] = useState(PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/content/hadith/${collection}`} className="text-sm text-zinc-500 hover:text-foreground">
          ← {collection.charAt(0).toUpperCase() + collection.slice(1)}
        </Link>
        <PageHeader title={data?.title ?? `Section ${section}`} subtitle={data ? `${data.hadiths.length} hadith` : undefined} />
      </div>

      {loading && <Spinner />}
      {error && <Notice tone="bad" title="Couldn't load this section">{error}</Notice>}

      {data && (
        <div className="space-y-3">
          {data.hadiths.slice(0, shown).map((hadith) => (
            <Card key={hadith.hadithnumber}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Hadith {hadith.hadithnumber}</span>
                {hadith.grades.map((grade, index) => (
                  <Pill key={index}>{[grade.name, grade.grade].filter(Boolean).join(": ") || "Graded"}</Pill>
                ))}
              </div>
              <p className="text-sm leading-relaxed">{hadith.text || "No English text for this entry."}</p>
            </Card>
          ))}
          {shown < data.hadiths.length && (
            <button
              onClick={() => setShown((count) => count + PAGE_SIZE)}
              className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Show {Math.min(PAGE_SIZE, data.hadiths.length - shown)} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
