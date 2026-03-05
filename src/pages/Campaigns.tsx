import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Campaign = Tables<"campaigns">;

const statusColors: Record<string, string> = {
  active: "bg-[hsl(var(--metric-green)/0.15)] text-[hsl(var(--metric-green))] border-transparent",
  paused: "bg-[hsl(var(--metric-amber)/0.15)] text-[hsl(var(--metric-amber))] border-transparent",
  completed: "bg-[hsl(var(--metric-blue)/0.15)] text-[hsl(var(--metric-blue))] border-transparent",
  draft: "bg-muted text-muted-foreground border-transparent",
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground mt-1">View all your outbound email campaigns</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Campaign Name</TableHead>
              <TableHead className="text-right">Emails Sent</TableHead>
              <TableHead className="text-right">Opens</TableHead>
              <TableHead className="text-right">Replies</TableHead>
              <TableHead className="text-right">Positive</TableHead>
              <TableHead className="text-right">Bounce Rate</TableHead>
              <TableHead className="text-right">Meetings</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No campaigns yet — sync your data from Settings</TableCell></TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">{c.emails_sent.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.opens.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.replies}</TableCell>
                  <TableCell className="text-right">{c.positive_replies}</TableCell>
                  <TableCell className="text-right">{Number(c.bounce_rate)}%</TableCell>
                  <TableCell className="text-right">{c.meetings_booked}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status] ?? statusColors.draft}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
