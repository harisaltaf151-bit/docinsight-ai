"use client";

import * as React from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "@/components/onboarding/provider-card";
import { PROVIDER_IDS, type ProviderId } from "@/types/provider";

interface ProviderStepProps {
  selected: ProviderId;
  onSelect: (id: ProviderId) => void;
  onContinue: () => void;
}

export function ProviderStep({ selected, onSelect, onContinue }: ProviderStepProps) {
  return (
    <div className="step-enter space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Step 1 of 3
        </p>
        <h1 className="font-display text-3xl font-semibold text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Choose your AI provider
        </h1>
        <p className="max-w-md text-balance text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Pick where to send your documents for analysis. You can switch providers or
          change the model at any time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROVIDER_IDS.map((id, i) => (
          <div
            key={id}
            className="step-enter"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <ProviderCard id={id} selected={selected === id} onSelect={onSelect} />
          </div>
        ))}
      </div>

      <footer className="flex flex-col items-stretch gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <Lock className="h-3.5 w-3.5" />
          Your key is stored only in this browser. Cleared when you close the tab.
        </p>
        <Button onClick={onContinue} size="lg" className="group sm:w-auto">
          Continue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </footer>
    </div>
  );
}
