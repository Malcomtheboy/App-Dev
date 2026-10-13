"use client";

import Link from "next/link";
import { arabicLetters, arabicSentences, arabicWords, harakatList } from "@/lib/curriculum";
import { useApi } from "@/lib/use-api";
import type { HadithCollection } from "@/lib/api";
import { Card, PageHeader, Pill } from "@/components/ui";

export default function ContentPage() {
  const { data: collections, error } = useApi<HadithCollection[]>("/api/hadith/collections");
  const arabicItems = arabicLetters.length + harakatList.length + arabicWords.length + arabicSentences.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Content" subtitle="What the app teaches and shows, as it is shipped today." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/content/hadith" className="block transition-opacity hover:opacity-90">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Hadith</h2>
              {error ? <Pill tone="bad">API offline</Pill> : <Pill tone="good">Live from the API</Pill>}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Browse the collections and sections the Learn tab serves
              {collections ? ` (${collections.map((c) => c.name).join(", ")}).` : "."}
            </p>
          </Card>
        </Link>

        <Link href="/content/arabic" className="block transition-opacity hover:opacity-90">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Learn Arabic</h2>
              <Pill tone="good">{arabicItems} items</Pill>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Letters, harakat, words and sentences, with an automatic check that nothing is taught out of order.
            </p>
          </Card>
        </Link>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Dua of the day</h2>
            <Pill tone="warn">Needs database</Pill>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Today a single dua is built into the app. Choosing or scheduling duas from here comes once content can be
            stored and read by the app.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Quran</h2>
            <Pill>Managed upstream</Pill>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            The Quran text, translation and recitations come from the Quran Foundation API, so there is nothing to
            edit here. Its health is on the Overview page.
          </p>
        </Card>
      </div>
    </div>
  );
}
