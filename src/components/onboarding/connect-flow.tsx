"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/onboarding/brand-mark";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import { ProviderStep } from "@/components/onboarding/steps/provider-step";
import { KeyStep } from "@/components/onboarding/steps/key-step";
import { SuccessStep } from "@/components/onboarding/steps/success-step";
import { useApiKey } from "@/hooks/use-api-key";
import { useMounted } from "@/hooks/use-mounted";
import type { ProviderId } from "@/types/provider";
import { ROUTES } from "@/lib/navigation";

type Step = "select" | "key" | "success";

const STEP_INDEX: Record<Step, number> = { select: 1, key: 2, success: 3 };

export function ConnectFlow() {
  const router = useRouter();
  const mounted = useMounted();
  const { provider, model, setProvider, saveKey, hasKey, apiKey } = useApiKey();

  const [step, setStep] = React.useState<Step>("select");
  const [pendingRedirect, setPendingRedirect] = React.useState(false);

  // If a key is already saved, short-circuit straight to success on first render.
  React.useEffect(() => {
    if (!mounted) return;
    if (hasKey && apiKey && step === "select" && !pendingRedirect) {
      setStep("success");
    }
  }, [mounted, hasKey, apiKey, step, pendingRedirect]);

  function handleSelect(id: ProviderId) {
    setProvider(id);
  }

  function handleProviderContinue() {
    setStep("key");
  }

  function handleKeySubmit(key: string) {
    saveKey(key);
    setStep("success");
  }

  function handleBack() {
    setStep("select");
  }

  function handleChangeProvider() {
    setStep("select");
  }

  function handleFinish() {
    router.push(ROUTES.dashboard);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Hairline top bar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-6 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <BrandMark size={18} />
          <span className="text-sm font-semibold tracking-tight">DocInsight AI</span>
        </div>
        <div className="hidden sm:block">
          <ProgressDots total={3} current={STEP_INDEX[step]} />
        </div>
      </header>

      {/* Step body */}
      <main className="flex flex-1 items-start justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-2xl">
          {/* Mobile progress */}
          <div className="mb-8 sm:hidden">
            <ProgressDots total={3} current={STEP_INDEX[step]} />
          </div>

          {step === "select" && (
            <ProviderStep
              selected={provider}
              onSelect={handleSelect}
              onContinue={handleProviderContinue}
            />
          )}

          {step === "key" && (
            <KeyStep
              provider={provider}
              onBack={handleBack}
              onSubmit={handleKeySubmit}
              onChangeProvider={handleChangeProvider}
            />
          )}

          {step === "success" && (
            <SuccessStep
              provider={provider}
              model={model}
              onContinue={handleFinish}
              onChangeProvider={handleChangeProvider}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 px-6 py-4 dark:border-zinc-800/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between text-xs text-zinc-500">
          <span>Session keys only. No accounts. No tracking.</span>
          <span className="num-tabular">v0.1</span>
        </div>
      </footer>
    </div>
  );
}
