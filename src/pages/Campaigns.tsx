import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Campaign = Tables<"campaigns">;

const statusColors: Record<string, string> = {
  active: "bg-[hsl(var(--metric-green)/0.15)] text-[hsl(var(--metric-green))] border-transparent",
  paused: "bg-[hsl(var(--metric-amber)/0.15)] text-[hsl(var(--metric-amber))] border-transparent",
  completed: "bg-[hsl(var(--metric-purple)/0.15)] text-[hsl(var(--metric-purple))] border-transparent",
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

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Campaign Name</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Sent</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Opens</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Replies</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Positive</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Bounce</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Meetings</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No campaigns yet — sync your data from Settings</TableCell></TableRow>
            ) : (
              campaigns.map((c) => (
                <TableRow key={c.id} className="hover:bg-accent/30 transition-colors border-border">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.emails_sent.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.opens.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.replies}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.positive_replies}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(c.bounce_rate)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{c.meetings_booked}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status] ?? statusColors.draft}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
