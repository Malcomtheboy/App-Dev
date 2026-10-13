"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { arabicLetters, arabicSentences, arabicWords, harakatList, runCurriculumChecks } from "@/lib/curriculum";
import { Card, Notice, PageHeader, Pill } from "@/components/ui";

const LEVELS = [
  { key: "letters", label: "Letters", count: arabicLetters.length },
  { key: "harakat", label: "Harakat", count: harakatList.length },
  { key: "words", label: "Words", count: arabicWords.length },
  { key: "sentences", label: "Sentences", count: arabicSentences.length },
] as const;

type LevelKey = (typeof LEVELS)[number]["key"];

const arabic = "text-2xl leading-relaxed";
const head = "py-2 pr-4 font-medium";
const cell = "py-2.5 pr-4";

export default function ArabicContentPage() {
  const [level, setLevel] = useState<LevelKey>("letters");
  const checks = useMemo(() => runCurriculumChecks(), []);
  const failed = checks.filter((check) => !check.passed);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content" className="text-sm text-zinc-500 hover:text-foreground">
          ← Content
        </Link>
        <PageHeader title="Learn Arabic" subtitle="The four levels exactly as they ship in the app, read from the app's own lesson files." />
      </div>

      <Card title="Lesson order check">
        {failed.length === 0 ? (
          <Notice title={`All ${checks.length} checks pass`}>
            Nothing is taught before the learner has met the letters and vowel marks it uses.
          </Notice>
        ) : (
          <Notice tone="bad" title={`${failed.length} of ${checks.length} checks need attention`} />
        )}
        <ul className="mt-4 space-y-2 text-sm">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2">
              <Pill tone={check.passed ? "good" : "bad"}>{check.passed ? "Pass" : "Fail"}</Pill>
              <span>
                {check.label}
                {check.detail && <span className="block text-xs text-red-600">{check.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((item) => (
          <button
            key={item.key}
            onClick={() => setLevel(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              level === item.key ? "bg-accent text-accent-on" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          {level === "letters" && (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className={head}>#</th>
                  <th className={head}>Name</th>
                  <th className={head}>Isolated</th>
                  <th className={head}>Initial</th>
                  <th className={head}>Medial</th>
                  <th className={head}>Final</th>
                  <th className={head}>Pronunciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {arabicLetters.map((letter) => (
                  <tr key={letter.id}>
                    <td className={`${cell} text-zinc-500`}>{letter.id}</td>
                    <td className={`${cell} font-medium`}>{letter.name}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{letter.isolated}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{letter.initial}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{letter.medial}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{letter.final}</td>
                    <td className={`${cell} text-zinc-600 dark:text-zinc-400`}>{letter.pronunciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {level === "harakat" && (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className={head}>Name</th>
                  <th className={head}>Mark on ب</th>
                  <th className={head}>Examples</th>
                  <th className={head}>Sound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {harakatList.map((mark) => (
                  <tr key={mark.id}>
                    <td className={`${cell} font-medium`}>{mark.name}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{`ب${mark.mark}`}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{mark.examples.join("  ")}</td>
                    <td className={`${cell} text-zinc-600 dark:text-zinc-400`}>{mark.sound}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {level === "words" && (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className={head}>#</th>
                  <th className={head}>Word</th>
                  <th className={head}>Sound it out</th>
                  <th className={head}>Transliteration</th>
                  <th className={head}>Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {arabicWords.map((word) => (
                  <tr key={word.id}>
                    <td className={`${cell} text-zinc-500`}>{word.id}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{word.word}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{word.parts.join(" · ")}</td>
                    <td className={`${cell} italic`}>{word.transliteration}</td>
                    <td className={cell}>{word.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {level === "sentences" && (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className={head}>#</th>
                  <th className={head}>Sentence</th>
                  <th className={head}>Transliteration</th>
                  <th className={head}>Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {arabicSentences.map((sentence) => (
                  <tr key={sentence.id}>
                    <td className={`${cell} text-zinc-500`}>{sentence.id}</td>
                    <td className={`${cell} ${arabic}`} dir="rtl">{sentence.sentence}</td>
                    <td className={`${cell} italic`}>{sentence.transliteration}</td>
                    <td className={cell}>{sentence.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <p className="text-xs text-zinc-500">
        Read-only for now. Lessons live in <code>apps/mobile/src/data</code>; editing from here needs the database.
      </p>
    </div>
  );
}
