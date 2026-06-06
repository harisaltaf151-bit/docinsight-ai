import Link from "next/link";
import { ArrowRight, FileSearch, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { KeyValueRow } from "@/components/shared/key-value-row";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { ROUTES } from "@/lib/navigation";

const QUICK_ACTIONS = [
  {
    title: "Analyze a document",
    description: "Upload a PDF or paste text and get a summary, insights, and action items.",
    href: ROUTES.analyze,
    icon: FileSearch,
  },
  {
    title: "Chat with a document",
    description: "Ask questions about any document you've analyzed. Powered by RAG.",
    href: ROUTES.chat,
    icon: MessageSquare,
  },
  {
    title: "Configure API keys",
    description: "Use your own Claude, OpenAI, Gemini, or Groq key. Session-only storage.",
    href: ROUTES.settings,
    icon: Sparkles,
  },
];

export default function DashboardPage() {
  return (
    <>
      <Navbar title="Dashboard" description="Welcome back — pick up where you left off." />
      <PageContainer>
        <PageHeader
          title="Overview"
          description="Your document analysis workspace."
          actions={
            <Button asChild>
              <Link href={ROUTES.analyze}>
                New analysis <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Card key={a.href} className="group transition-colors hover:border-primary/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <a.icon className="h-4 w-4" />
                  </span>
                  <CardTitle className="text-base">{a.title}</CardTitle>
                </div>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                  <Link href={a.href}>
                    Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <RecentActivityCard />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>System health and session info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <KeyValueRow label="API" value={<span className="text-emerald-600">Online</span>} />
              <KeyValueRow label="Streaming" value={<span className="text-emerald-600">Ready</span>} />
              <KeyValueRow label="RAG" value={<span className="text-emerald-600">Available</span>} />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
