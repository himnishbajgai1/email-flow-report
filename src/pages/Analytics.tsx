import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"campaigns">;

const COLORS = ["hsl(210 100% 56%)", "hsl(152 69% 53%)", "hsl(38 92% 60%)", "hsl(270 76% 60%)", "hsl(187 85% 53%)"];

export default function Analytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    supabase.from("campaigns").select("*").order("emails_sent", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []);
    });
  }, []);

  const barData = campaigns.slice(0, 10).map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name,
    emails: c.emails_sent,
    replies: c.replies,
    meetings: c.meetings_booked,
  }));

  const totalReplies = campaigns.reduce((s, c) => s + c.replies, 0);
  const totalPositive = campaigns.reduce((s, c) => s + c.positive_replies, 0);
  const totalNeutral = totalReplies - totalPositive;
  const pieData = [
    { name: "Positive", value: totalPositive },
    { name: "Neutral/Negative", value: totalNeutral > 0 ? totalNeutral : 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Aggregate campaign performance insights</p>
      </div>

      {campaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">No campaign data yet — sync from Settings</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Campaign Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 12% 18%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(215 15% 55%)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(230 14% 11%)", border: "1px solid hsl(230 12% 18%)", borderRadius: "8px", color: "hsl(210 20% 95%)" }} />
                    <Bar dataKey="emails" fill="hsl(210 100% 56%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="replies" fill="hsl(38 92% 60%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="meetings" fill="hsl(152 69% 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reply Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(230 14% 11%)", border: "1px solid hsl(230 12% 18%)", borderRadius: "8px", color: "hsl(210 20% 95%)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                  <span className="text-muted-foreground">Positive ({totalPositive})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                  <span className="text-muted-foreground">Other ({totalNeutral > 0 ? totalNeutral : 0})</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
