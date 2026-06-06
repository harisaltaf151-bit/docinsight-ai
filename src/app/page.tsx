import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/onboarding/brand-mark";
import { ROUTES } from "@/lib/navigation";

export default function HomePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        <header className="flex h-14 items-center justify-between">
          <Link
            href={ROUTES.home}
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <BrandMark size={18} />
            DocInsight AI
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href={ROUTES.dashboard}>Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.onboarding}>
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            Turn long documents into{" "}
            <span className="text-zinc-500 dark:text-zinc-400">clear action</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Upload a PDF or paste text. Get a summary, key insights, and concrete next steps
            from your choice of Claude, OpenAI, Gemini, or Groq — streamed in real time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="group">
              <Link href={ROUTES.onboarding}>
                Connect your provider <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href={ROUTES.dashboard}>View dashboard</Link>
            </Button>
          </div>

          <div className="mt-24 grid w-full grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 text-left sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
            {[
              { icon: FileText, title: "PDF or text", desc: "Drop a PDF or paste. We handle the rest." },
              { icon: Sparkles, title: "Multi-provider", desc: "Switch between Claude, OpenAI, Gemini, Groq." },
              { icon: Zap, title: "Streamed", desc: "Tokens appear live. Cancel anytime." },
            ].map((f) => (
              <div key={f.title} className="bg-zinc-50 p-6 dark:bg-zinc-950">
                <f.icon className="h-4 w-4 text-zinc-900 dark:text-zinc-50" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-6 text-center text-xs text-zinc-500">
          Built for the DocInsight AI internship project.
        </footer>
      </div>
    </main>
  );
}
