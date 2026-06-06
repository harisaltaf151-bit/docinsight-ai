"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Lightbulb, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyValueRow } from "@/components/shared/key-value-row";
import { useResults } from "@/hooks/use-results";
import { useApiKey } from "@/hooks/use-api-key";
import { ROUTES } from "@/lib/navigation";

const PREVIEW_LIMIT = 3;

export function RecentActivityCard() {
  const { results, previews, ready } = useResults();
  const { provider, model, hasKey } = useApiKey();
  const recent = previews.slice(0, PREVIEW_LIMIT);
  const totalInsights = results.reduce((acc, r) => acc + r.insights.length, 0);
  const totalActions = results.reduce((acc, r) => acc + r.actions.length, 0);
  const avgLatency =
    results.length === 0
      ? null
      : Math.round(results.reduce((acc, r) => acc + r.meta.latencyMs, 0) / results.length);

  if (!ready) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Recent activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-md bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Recent activity</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {results.length} {results.length === 1 ? "analysis" : "analyses"}
          </Badge>
        </div>
        <CardDescription>
          {results.length === 0
            ? "Your latest analyses will appear here once you run them."
            : "Your last few analyses from this session."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.length === 0 ? (
          <div className="space-y-1">
            <KeyValueRow label="Documents analyzed" value="0" />
            <KeyValueRow label="Insights generated" value="0" />
            <KeyValueRow label="Action items" value="0" />
            <KeyValueRow
              label="Active provider"
              value={hasKey ? provider : <span className="text-amber-600">Not configured</span>}
            />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <KeyValueRow label="Documents analyzed" value={results.length.toString()} />
              <KeyValueRow label="Insights generated" value={totalInsights.toString()} />
              <KeyValueRow label="Action items" value={totalActions.toString()} />
              <KeyValueRow
                label="Avg latency"
                value={avgLatency === null ? "—" : `${avgLatency} ms`}
              />
              <KeyValueRow
                label="Active provider"
                value={
                  hasKey ? (
                    <span className="font-mono text-xs">
                      {provider} · {model}
                    </span>
                  ) : (
                    <span className="text-amber-600">Not configured</span>
                  )
                }
              />
            </div>

            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/results/${p.id}` as typeof ROUTES.results}
                    className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {p.sourceKind === "pdf" ? (
                        <FileText className="h-3.5 w-3.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
                        {p.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                        {p.insightCount} insights · {p.actionCount} actions · {p.model}
                      </p>
                    </div>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                      <Lightbulb className="h-3 w-3" />
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {results.length > PREVIEW_LIMIT && (
              <div className="pt-1">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                  <Link href={ROUTES.results}>
                    View all {results.length} analyses
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
