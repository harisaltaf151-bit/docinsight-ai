"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import { ProviderMark } from "@/components/onboarding/provider-mark";
import { providerService } from "@/services/provider.service";
import { PROVIDER_META, PROVIDER_IDS, type ProviderId } from "@/types/provider";
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

const STEP_INDEX: Record<Step, number> = {
  select: 1,
  key: 2,
  verifying: 3,
  success: 3,
  error: 3,
};

type Step = "select" | "key" | "verifying" | "success" | "error";

export interface ProviderRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fired after the key has been saved to sessionStorage and the verify
   * round-trip succeeded. Parent should re-trigger whatever action was
   * blocked (analysis, chat send, …) using the provided credentials.
   */
  onConnected?: (info: { provider: ProviderId; model: string; apiKey: string }) => void;
  /** Used for the dialog title and confirm button copy. */
  purpose?: "analyze" | "chat";
}

const PURPOSE_COPY: Record<NonNullable<ProviderRequiredDialogProps["purpose"]>, string> = {
  analyze: "analyze documents",
  chat: "chat with your document",
};

export function ProviderRequiredDialog({
  open,
  onOpenChange,
  onConnected,
  purpose = "analyze",
}: ProviderRequiredDialogProps) {
  const [step, setStep] = React.useState<Step>("select");
  const [selected, setSelected] = React.useState<ProviderId>("openai");
  const [model, setModel] = React.useState<string>(PROVIDER_META.openai.defaultModel);
  const [value, setValue] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset internal state whenever the dialog is opened from a closed state.
  React.useEffect(() => {
    if (open) {
      setStep("select");
      setSelected("openai");
      setModel(PROVIDER_META.openai.defaultModel);
      setValue("");
      setShow(false);
      setTouched(false);
      setError(null);
    }
  }, [open]);

  function handleSelect(id: ProviderId) {
    setSelected(id);
    setModel(PROVIDER_META[id].defaultModel);
  }

  function handleContinueFromSelect() {
    setStep("key");
  }

  function handleBack() {
    if (step === "verifying") return;
    setStep("select");
    setError(null);
  }

  const trimmed = value.trim();
  const hint = PREFIX_HINT[selected];
  const isShort = trimmed.length > 0 && trimmed.length < 20;
  const wrongPrefix = trimmed.length > 0 && !trimmed.startsWith(hint.prefix);
  const looksGood = trimmed.startsWith(hint.prefix) && trimmed.length >= 20;
  const canSubmit = trimmed.length >= 20;

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setTouched(true);
    if (!canSubmit) {
      toast.error("That doesn't look like a valid API key");
      return;
    }
    setStep("verifying");
    setError(null);
    try {
      const result = await providerService.verifyKey(selected, trimmed);
      if (!result.ok) {
        setError(result.error ?? "Verification failed");
        setStep("error");
        return;
      }
      setStep("success");
      // Brief celebration, then close + notify parent.
      window.setTimeout(() => {
        onConnected?.({ provider: selected, model, apiKey: trimmed });
        onOpenChange(false);
      }, 700);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      setStep("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={step === "verifying" ? () => undefined : onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        onInteractOutside={(e) => {
          if (step === "verifying") e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (step === "verifying") e.preventDefault();
        }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <Lock className="h-3 w-3" />
              Session keys only
            </span>
            <ProgressDots total={3} current={STEP_INDEX[step]} />
          </div>
          <div>
            <DialogTitle className="font-display text-2xl tracking-tight">
              {step === "select" && "Choose your AI provider"}
              {step === "key" && `Connect ${PROVIDER_META[selected].name}`}
              {step === "verifying" && "Verifying key…"}
              {step === "success" && `${PROVIDER_META[selected].name} is ready`}
              {step === "error" && "Verification failed"}
            </DialogTitle>
            <DialogDescription>
              {step === "select" &&
                `Pick a provider to ${PURPOSE_COPY[purpose]}. You can switch any time in settings.`}
              {step === "key" &&
                "We send your key directly to the provider on every request. Never persisted on our servers."}
              {step === "verifying" && "Pinging the provider to confirm the key works."}
              {step === "success" && `Connected to ${PROVIDER_META[selected].name} · ${model}`}
              {step === "error" &&
                (error ?? "The provider rejected the key. Double-check it and try again.")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {step === "select" && (
          <ProviderPicker selected={selected} onSelect={handleSelect} />
        )}

        {step === "key" && (
          <KeyForm
            provider={selected}
            model={model}
            onModelChange={setModel}
            value={value}
            onChange={setValue}
            show={show}
            onToggleShow={() => setShow((s) => !s)}
            touched={touched}
            onBlur={() => setTouched(true)}
            isShort={isShort}
            wrongPrefix={wrongPrefix}
            looksGood={looksGood}
            onSubmit={handleVerify}
          />
        )}

        {step === "verifying" && <Verifying provider={selected} />}

        {step === "success" && <Success provider={selected} model={model} />}

        {step === "error" && error && (
          <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        <footer className="flex flex-col-reverse items-stretch gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          {step === "select" ? (
            <>
              <p className="text-xs text-zinc-500">Stored only in this browser. Cleared on tab close.</p>
              <Button onClick={handleContinueFromSelect} size="lg" className="group sm:w-auto">
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          ) : step === "key" ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change provider
              </button>
              <Button
                type="submit"
                form="dlg-key-form"
                size="lg"
                disabled={!canSubmit}
                data-dlg-verify="1"
                className="group sm:w-auto"
              >
                Verify and connect
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          ) : step === "error" ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Edit key
              </button>
              <Button
                type="button"
                onClick={() => void handleVerify()}
                size="lg"
                className="group sm:w-auto"
              >
                Try again
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          ) : step === "verifying" ? (
            <>
              <span className="text-xs text-zinc-500">This usually takes 1–2 seconds.</span>
              <Button size="lg" disabled className="sm:w-auto">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                Saved to sessionStorage. Starting…
              </span>
              <Button size="lg" disabled className="sm:w-auto">
                <Check className="h-4 w-4" />
                Ready
              </Button>
            </>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

interface ProviderPickerProps {
  selected: ProviderId;
  onSelect: (id: ProviderId) => void;
}

function ProviderPicker({ selected, onSelect }: ProviderPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Provider">
      {PROVIDER_IDS.map((id) => {
        const meta = PROVIDER_META[id];
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all",
              isSelected
                ? "border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 dark:border-zinc-50 dark:bg-zinc-900/60 dark:ring-zinc-50"
                : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/40",
            )}
          >
            <ProviderMark id={id} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{meta.name}</p>
              <p className="truncate text-xs text-zinc-500">{meta.tagline}</p>
            </div>
            {isSelected && (
              <Check className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-50" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface KeyFormProps {
  provider: ProviderId;
  model: string;
  onModelChange: (m: string) => void;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  touched: boolean;
  onBlur: () => void;
  isShort: boolean;
  wrongPrefix: boolean;
  looksGood: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function KeyForm({
  provider,
  model,
  onModelChange,
  value,
  onChange,
  show,
  onToggleShow,
  touched,
  onBlur,
  isShort,
  wrongPrefix,
  looksGood,
  onSubmit,
}: KeyFormProps) {
  const meta = PROVIDER_META[provider];
  const hint = PREFIX_HINT[provider];
  const docsUrl = DOCS_URL[provider];
  return (
    <form className="space-y-4" onSubmit={onSubmit} id="dlg-key-form">
      <div className="space-y-2">
        <Label htmlFor="provider-model" className="text-xs">
          Model
        </Label>
        <select
          id="provider-model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          {meta.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="dlg-apiKey" className="text-xs">
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
            id="dlg-apiKey"
            name="apiKey"
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={`${hint.prefix}…`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "h-11 font-mono text-sm tracking-tight pr-20",
              touched && (isShort || wrongPrefix) && "border-amber-400",
              looksGood && "border-zinc-950 dark:border-zinc-50",
            )}
            aria-invalid={touched && (isShort || wrongPrefix)}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Clear"
                className="rounded p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleShow}
              aria-label={show ? "Hide key" : "Show key"}
              className="rounded p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <p className="flex h-4 items-center gap-1.5 text-xs text-zinc-500" aria-live="polite">
          {touched && isShort && (
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
              <span>Stored only in this browser's sessionStorage</span>
            </>
          )}
        </p>
      </div>
    </form>
  );
}

function Verifying({ provider }: { provider: ProviderId }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative">
        <ProviderMark id={provider} size="md" />
        <span
          aria-hidden
          className="absolute -inset-2 animate-ping rounded-full border border-zinc-300 dark:border-zinc-700"
        />
      </div>
      <p className="text-xs text-zinc-500">Talking to {PROVIDER_META[provider].name}…</p>
    </div>
  );
}

function Success({ provider, model }: { provider: ProviderId; model: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        style={{ animation: "check-pop 420ms cubic-bezier(0.2, 0, 0, 1) both" }}
      >
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">
        {PROVIDER_META[provider].name} <span className="font-mono text-xs text-zinc-500">· {model}</span>
      </p>
    </div>
  );
}
