"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Eye, EyeOff, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderMark } from "@/components/onboarding/provider-mark";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { cn } from "@/lib/utils";

const PREFIX_HINT: Record<ProviderId, { prefix: string; label: string }> = {
  claude: { prefix: "sk-ant-", label: "Anthropic Console" },
  openai: { prefix: "sk-", label: "OpenAI Platform" },
  gemini: { prefix: "AIza", label: "Google AI Studio" },
  groq: { prefix: "gsk_", label: "Groq Cloud Console" },
};

const DOCS_URL: Record<ProviderId, string> = {
  claude: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  gemini: "https://aistudio.google.com/apikey",
  groq: "https://console.groq.com/keys",
};

interface KeyStepProps {
  provider: ProviderId;
  onBack: () => void;
  onSubmit: (key: string) => void;
  onChangeProvider: () => void;
}

export function KeyStep({ provider, onBack, onSubmit, onChangeProvider }: KeyStepProps) {
  const meta = PROVIDER_META[provider];
  const hint = PREFIX_HINT[provider];
  const docsUrl = DOCS_URL[provider];

  const [value, setValue] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const isShort = trimmed.length > 0 && trimmed.length < 20;
  const wrongPrefix = trimmed.length > 0 && !trimmed.startsWith(hint.prefix);
  const looksGood = trimmed.startsWith(hint.prefix) && trimmed.length >= 20;

  const canSubmit = trimmed.length >= 20;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) {
      toast.error("That doesn't look like a valid API key");
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="step-enter space-y-8">
      <header className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <ProviderMark id={provider} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Step 2 of 3
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
              Connect {meta.name}
            </h1>
          </div>
        </div>

        <p className="max-w-md text-balance text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Paste your {meta.name} API key. We send it directly to the provider on every
          request and never persist it on our servers.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="apiKey" className="text-sm">
            API key
          </Label>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Get one at {hint.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="relative">
          <Input
            id="apiKey"
            name="apiKey"
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={`${hint.prefix}\u2026`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "h-12 font-mono text-sm tracking-tight",
              "pr-20",
              touched && isEmpty && "border-zinc-300",
              touched && (isShort || wrongPrefix) && "border-amber-400",
              looksGood && "border-zinc-950 dark:border-zinc-50",
            )}
            aria-invalid={touched && !canSubmit}
            aria-describedby="apiKey-help"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={() => setValue("")}
                aria-label="Clear"
                className="rounded p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide key" : "Show key"}
              className="rounded p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div
          id="apiKey-help"
          className="flex h-4 items-center gap-1.5 text-xs text-zinc-500"
          aria-live="polite"
        >
          {touched && isEmpty && (
            <>
              <span className="h-1 w-1 rounded-full bg-zinc-400" />
              <span>Required to continue</span>
            </>
          )}
          {touched && isShort && !isEmpty && (
            <>
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              <span>That looks too short for an API key</span>
            </>
          )}
          {touched && wrongPrefix && !isShort && (
            <>
              <span className="h-1 w-1 rounded-full bg-amber-500" />
              <span>
                Should start with <span className="font-mono">{hint.prefix}</span>
              </span>
            </>
          )}
          {looksGood && (
            <>
              <Check className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-50" />
              <span className="text-zinc-700 dark:text-zinc-300">Looks good</span>
            </>
          )}
          {!touched && !value && (
            <>
              <Lock className="h-3 w-3" />
              <span>Stored only in your browser's sessionStorage</span>
            </>
          )}
        </div>
      </div>

      <footer className="flex flex-col-reverse items-stretch gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onChangeProvider}
          className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-50"
        >
          Use a different provider
        </button>
        <Button type="submit" size="lg" disabled={!canSubmit} className="group sm:w-auto">
          Save and continue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </footer>
    </form>
  );
}
