import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  name: string | null;
  email: string;
  status: string;
  created_at: string;
  campaigns: { name: string } | null;
}

const leadStatusColors: Record<string, string> = {
  new: "bg-[hsl(var(--metric-blue)/0.15)] text-[hsl(var(--metric-blue))] border-transparent",
  contacted: "bg-[hsl(var(--metric-amber)/0.15)] text-[hsl(var(--metric-amber))] border-transparent",
  replied: "bg-[hsl(var(--metric-green)/0.15)] text-[hsl(var(--metric-green))] border-transparent",
  meeting: "bg-[hsl(var(--metric-purple)/0.15)] text-[hsl(var(--metric-purple))] border-transparent",
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leads")
      .select("id, name, email, status, created_at, campaigns(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLeads((data as unknown as Lead[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground mt-1">Track all leads from your campaigns</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : leads.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No leads yet — sync your data from Settings</TableCell></TableRow>
            ) : (
              leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name ?? "—"}</TableCell>
                  <TableCell>{l.email}</TableCell>
                  <TableCell><Badge className={leadStatusColors[l.status] ?? ""}>{l.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{l.campaigns?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
