import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { ApiKeyPanel } from "@/components/provider/api-key-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyValueRow } from "@/components/shared/key-value-row";

export default function SettingsPage() {
  return (
    <>
      <Navbar title="Settings" description="Providers, API keys, and preferences." />
      <PageContainer>
        <PageHeader
          title="Settings"
          description="Configure your AI provider and manage your session preferences."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ApiKeyPanel />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About keys</CardTitle>
              <CardDescription>How your keys are handled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <KeyValueRow label="Storage" value={<Badge variant="secondary">sessionStorage</Badge>} />
              <KeyValueRow label="Persisted to server" value={<Badge variant="destructive">No</Badge>} />
              <KeyValueRow label="Lifetime" value="Until tab close" />
              <KeyValueRow label="Transmitted" value="Per request, https only" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
