"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCard } from "@/components/analysis/summary-card";
import { InsightsCard } from "@/components/analysis/insights-card";
import { ActionsCard } from "@/components/analysis/actions-card";
import { ResultMeta } from "@/components/results/result-meta";
import { ResultToolbar } from "@/components/results/result-toolbar";
import { useResults } from "@/hooks/use-results";
import { ROUTES } from "@/lib/navigation";

export default function ResultDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { results, ready, remove } = useResults();

  const id = params?.id ?? "";
  const result = React.useMemo(
    () => results.find((r) => r.id === id) ?? null,
    [results, id],
  );

  function handleDelete(deleteId: string) {
    remove(deleteId);
    toast.success("Result deleted");
    router.push(ROUTES.results);
  }

  return (
    <>
      <Navbar
        title="Results"
        description="Detail view of a single analysis."
        actions={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href={ROUTES.results}>
              <ArrowLeft className="h-3.5 w-3.5" />
              All results
            </Link>
          </Button>
        }
      />
      <PageContainer>
        <PageHeader
          title="Analysis detail"
          description="Summary, key insights, and action items extracted from the source."
        />

        {!ready ? (
          <DetailSkeleton />
        ) : !result ? (
          <NotFoundState />
        ) : (
          <div className="space-y-5">
            <ResultMeta
              title={result.title}
              sourceLabel={result.sourceLabel}
              sourceKind={result.sourceKind}
              createdAt={result.createdAt}
              provider={result.meta.provider}
              model={result.meta.model}
              latencyMs={result.meta.latencyMs}
            />
            <ResultToolbar result={result} onDelete={handleDelete} />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <SummaryCard status="complete" text={result.summary} />
              </div>
              <div className="space-y-3 lg:col-span-1">
                <InsightsCard
                  status="complete"
                  buffer={result.summary}
                  items={result.insights}
                />
              </div>
              <div className="space-y-3 lg:col-span-1">
                <ActionsCard
                  status="complete"
                  buffer={result.summary}
                  items={result.actions}
                />
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
}

function NotFoundState() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <EmptyState
        icon={<FileSearch className="h-5 w-5" />}
        title="Result not found"
        description="This analysis isn't in the current session. It may have been deleted, or you opened the link in a different tab."
        action={{
          label: "Back to results",
          onClick: () => router.push(ROUTES.results),
        }}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
