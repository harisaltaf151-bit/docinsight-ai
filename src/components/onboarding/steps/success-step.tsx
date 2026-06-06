"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckAnimation } from "@/components/onboarding/check-animation";
import { ProviderMark } from "@/components/onboarding/provider-mark";
import { PROVIDER_META, type ProviderId } from "@/types/provider";

interface SuccessStepProps {
  provider: ProviderId;
  model: string;
  onContinue: () => void;
  onChangeProvider: () => void;
}

export function SuccessStep({ provider, model, onContinue, onChangeProvider }: SuccessStepProps) {
  const meta = PROVIDER_META[provider];

  return (
    <div className="step-enter flex flex-col items-center text-center">
      <CheckAnimation />

      <div className="mt-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        <ProviderMark id={provider} size="sm" />
        <span>Connected</span>
      </div>

      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
        {meta.name} is ready
      </h1>

      <p className="mt-3 max-w-sm text-balance text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        We'll use{" "}
        <span className="font-mono text-[12px] text-zinc-700 dark:text-zinc-300">{model}</span>{" "}
        by default. You can change the model or switch providers any time in settings.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-3">
        <Button onClick={onContinue} size="lg" className="group w-full">
          Go to workspace
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
        <button
          type="button"
          onClick={onChangeProvider}
          className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-50"
        >
          Use a different provider
        </button>
      </div>
    </div>
  );
}
