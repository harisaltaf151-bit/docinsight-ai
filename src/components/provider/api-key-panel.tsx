"use client";

import * as React from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApiKey } from "@/hooks/use-api-key";
import { PROVIDER_META, type ProviderId } from "@/types/provider";

export function ApiKeyPanel() {
  const { provider, model, apiKey, setProvider, setModel, saveKey, clearKey, hasKey } = useApiKey();
  const [draft, setDraft] = React.useState("");
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setDraft(apiKey ?? "");
  }, [apiKey]);

  function onSave() {
    if (!draft.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    saveKey(draft.trim());
    toast.success(`${PROVIDER_META[provider].name} key saved for this session`);
  }

  function onClear() {
    clearKey();
    setDraft("");
    toast.message("API key cleared");
  }

  const meta = PROVIDER_META[provider];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">AI provider</CardTitle>
          {hasKey && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Key set
            </Badge>
          )}
        </div>
        <CardDescription>
          Choose a provider and paste your key. Keys are kept in sessionStorage only and never sent to our
          servers for storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Provider</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => {
              const m = PROVIDER_META[id];
              const active = provider === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setProvider(id)}
                  className={
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                    (active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-input hover:bg-accent")
                  }
                  aria-pressed={active}
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.tagline}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {meta.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="apiKey">API key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={show ? "text" : "password"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Paste your ${meta.name} key`}
                autoComplete="off"
                spellCheck={false}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide key" : "Show key"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={onSave}>Save</Button>
            {hasKey && (
              <Button variant="outline" onClick={onClear} aria-label="Clear key">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stored only in your browser's sessionStorage. Cleared when you close the tab.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
