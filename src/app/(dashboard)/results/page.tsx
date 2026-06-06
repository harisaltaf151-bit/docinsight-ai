"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileSearch, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultListItem } from "@/components/results/result-list-item";
import { useResults } from "@/hooks/use-results";
import { ROUTES } from "@/lib/navigation";

export default function ResultsPage() {
  const { previews, ready } = useResults();

  return (
    <>
      <Navbar
        title="Results"
        description="Analyses you've run this session."
      />
      <PageContainer>
        <PageHeader
          title="Results"
          description="Browse, revisit, and export the analyses you've produced this session."
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline">Session storage</Badge>
              {previews.length > 0 && (
                <Badge variant="secondary">
                  {previews.length} result{previews.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          }
        />

        {!ready ? (
          <ResultsSkeleton />
        ) : previews.length === 0 ? (
          <EmptyState
            icon={<FileSearch className="h-5 w-5" />}
            title="No results yet"
            description="Run an analysis to see the summary, insights, and action items appear here."
            action={{
              label: "Start an analysis",
              href: ROUTES.analyze,
            }}
          />
        ) : (
          <div className="space-y-6">
            <StatsStrip count={previews.length} />
            <ul className="space-y-2.5">
              {previews.map((p) => (
                <li key={p.id}>
                  <ResultListItem preview={p} />
                </li>
              ))}
            </ul>
            <div className="flex justify-center pt-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={ROUTES.analyze}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Run another analysis
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}

function StatsStrip({ count }: { count: number }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <Stat label="Results" value={String(count)} />
        <Stat label="Storage" value="Session" subtle />
        <Stat label="Encryption" value="—" subtle />
        <Stat label="Synced" value="Local" subtle />
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={
          subtle
            ? "mt-1 text-sm text-zinc-500 dark:text-zinc-400"
            : "mt-1 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        }
      >
        {value}
      </p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}
