"use client";

import Link from "next/link";
import type { HadithCollection } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { Card, Notice, PageHeader, Spinner } from "@/components/ui";

export default function HadithCollectionsPage() {
  const { data, error, loading } = useApi<HadithCollection[]>("/api/hadith/collections");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content" className="text-sm text-zinc-500 hover:text-foreground">
          ← Content
        </Link>
        <PageHeader title="Hadith" subtitle="The collections available in the Learn tab." />
      </div>

      {loading && <Spinner />}
      {error && <Notice tone="bad" title="Couldn't load the collections">{error}. Is the API running?</Notice>}

      <div className="grid gap-4 md:grid-cols-3">
        {data?.map((collection) => (
          <Link key={collection.key} href={`/content/hadith/${collection.key}`} className="block transition-opacity hover:opacity-90">
            <Card className="h-full">
              <h2 className="text-base font-semibold">{collection.name}</h2>
              <p className="mt-1 text-xs text-zinc-500">English translation · key: {collection.key}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
