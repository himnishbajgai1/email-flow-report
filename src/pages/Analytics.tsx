import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const COLORS = ["hsl(272 72% 55%)", "hsl(152 69% 53%)", "hsl(38 92% 60%)", "hsl(210 100% 56%)", "hsl(187 85% 53%)"];

export default function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    supabase.from("campaigns").select("*").order("emails_sent", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []);
    });
  }, []);

  const barData = campaigns.slice(0, 10).map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
    emails: c.emails_sent,
    replies: c.replies,
    
  }));

  const totalEmails = campaigns.reduce((s, c) => s + c.emails_sent, 0);
  const totalOpens = campaigns.reduce((s, c) => s + c.opens, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.replies, 0);
  const pieData = [
    { name: "Opened", value: totalOpens },
    { name: "Replied", value: totalReplies },
    { name: "No Response", value: Math.max(0, totalEmails - totalOpens) },
  ];

  const tooltipStyle = {
    backgroundColor: "hsl(260 18% 10%)",
    border: "1px solid hsl(260 14% 16%)",
    borderRadius: "8px",
    color: "hsl(250 20% 95%)",
    fontSize: "13px",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Aggregate campaign performance insights</p>
      </div>

      {campaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center text-muted-foreground">No campaign data yet — sync from Settings</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Campaign Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 14% 16%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(255 12% 50%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(255 12% 50%)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="emails" name="Emails Sent" fill="hsl(272 72% 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="replies" name="Replies" fill="hsl(38 92% 60%)" radius={[4, 4, 0, 0]} />
                    
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={10}
                      formatter={(value: string) => <span style={{ color: "hsl(255 12% 50%)", fontSize: "13px" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
