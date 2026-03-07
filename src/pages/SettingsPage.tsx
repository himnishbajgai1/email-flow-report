import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Key, Shield, Users, Copy, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { profile, role } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.workspace_id) return;
    supabase
      .from("api_connections")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setApiKey(data.api_key);
          setAutoSync(data.auto_sync_enabled);
          setLastSynced(data.last_synced_at);
          setConnectionId(data.id);
        }
      });
  }, [profile?.workspace_id]);

  const saveApiKey = async () => {
    if (!profile?.workspace_id) return;
    setSaving(true);
    if (connectionId) {
      await supabase.from("api_connections").update({ api_key: apiKey, auto_sync_enabled: autoSync }).eq("id", connectionId);
    } else {
      await supabase.from("api_connections").insert({ workspace_id: profile.workspace_id, api_key: apiKey, auto_sync_enabled: autoSync });
    }
    toast.success("Settings saved");
    setSaving(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-campaigns", {
        body: { workspace_id: profile?.workspace_id },
      });
      if (error) throw error;
      toast.success("Sync completed!");
      setLastSynced(new Date().toISOString());
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    }
    setSyncing(false);
  };

  const copyWorkspaceId = () => {
    if (profile?.workspace_id) {
      navigator.clipboard.writeText(profile.workspace_id);
      setCopied(true);
      toast.success("Workspace ID copied");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your API connection and preferences</p>
      </div>

      {/* Workspace Info */}
      {profile?.workspace_id && (
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace ID</p>
                <p className="text-sm font-mono text-foreground/80">{profile.workspace_id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={copyWorkspaceId} className="shrink-0 text-muted-foreground hover:text-foreground">
                {copied ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--metric-green))]" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Connection */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">API Connection</CardTitle>
              <CardDescription className="text-xs">Connect your Instantly.ai account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
            <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your Instantly.ai API key" className="h-11 bg-secondary/50 border-border" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto Sync</Label>
              <p className="text-xs text-muted-foreground">Automatically sync campaign data</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>
          {lastSynced && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--metric-green))]" />
              Last synced: {new Date(lastSynced).toLocaleString()}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={saveApiKey} disabled={saving} className="gradient-primary hover:opacity-90 font-medium">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button variant="outline" onClick={triggerSync} disabled={syncing || !apiKey} className="border-border hover:bg-accent">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {role === "admin" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Admin Panel</CardTitle>
                <CardDescription className="text-xs">Manage client accounts and workspaces</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground p-3 rounded-lg bg-secondary/30">
              <Users className="h-4 w-4" />
              <p className="text-sm">Admin management features coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
