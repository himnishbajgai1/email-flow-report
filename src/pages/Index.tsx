import { useEffect, useState } from "react";
import { Mail, MessageSquare, AlertTriangle, Megaphone, Reply, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AggregateMetrics {
  emails_sent: number;
  replies: number;
  bounce_rate: number;
  total_campaigns: number;
  active_campaigns: number;
}

interface DailyMetric {
  date: string;
  emails_sent: number;
  replies: number;
}

const CHART_COLORS: Record<string, { stroke: string; fill: string }> = {
  emails_sent: { stroke: "hsl(272 72% 55%)", fill: "hsl(272 72% 55% / 0.1)" },
  replies: { stroke: "hsl(38 92% 60%)", fill: "hsl(38 92% 60% / 0.1)" },
};

export default function Index() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<AggregateMetrics>({ emails_sent: 0, replies: 0, bounce_rate: 0, total_campaigns: 0, active_campaigns: 0 });
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: campaigns } = await supabase.from("campaigns").select("*");
      if (campaigns && campaigns.length > 0) {
        const agg = campaigns.reduce((acc, c) => ({
          emails_sent: acc.emails_sent + c.emails_sent,
          replies: acc.replies + c.replies,
          bounce_rate: acc.bounce_rate + Number(c.bounce_rate),
        }), { emails_sent: 0, replies: 0, bounce_rate: 0 });

        setMetrics({
          emails_sent: agg.emails_sent,
          replies: agg.replies,
          bounce_rate: Number((agg.bounce_rate / campaigns.length).toFixed(1)),
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter(c => c.status === "active").length,
        });
      }

      const { data: daily } = await supabase
        .from("campaign_metrics")
        .select("date, emails_sent, replies")
        .order("date", { ascending: true });
      if (daily) {
        const grouped = daily.reduce<Record<string, DailyMetric>>((acc, row) => {
          if (!acc[row.date]) acc[row.date] = { date: row.date, emails_sent: 0, replies: 0 };
          acc[row.date].emails_sent += row.emails_sent;
          acc[row.date].replies += row.replies;
          return acc;
        }, {});
        setDailyMetrics(Object.values(grouped));
      }
    };
    fetchData();
  }, []);

  const replyRate = metrics.emails_sent > 0 ? ((metrics.replies / metrics.emails_sent) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Emails Sent" value={metrics.emails_sent.toLocaleString()} icon={Mail} color="bg-[hsl(var(--metric-purple)/0.15)] text-[hsl(var(--metric-purple))]" />
        <MetricCard title="Total Replies" value={metrics.replies.toLocaleString()} icon={Reply} color="bg-[hsl(var(--metric-green)/0.15)] text-[hsl(var(--metric-green))]" />
        <MetricCard title="Reply Rate" value={replyRate} icon={MessageSquare} color="bg-[hsl(var(--metric-amber)/0.15)] text-[hsl(var(--metric-amber))]" />
        <MetricCard title="Bounce Rate" value={metrics.bounce_rate + "%"} icon={AlertTriangle} color="bg-[hsl(var(--metric-red)/0.15)] text-[hsl(var(--metric-red))]" />
        <MetricCard title="Active Campaigns" value={metrics.active_campaigns.toString()} icon={Activity} color="bg-[hsl(var(--metric-cyan)/0.15)] text-[hsl(var(--metric-cyan))]" />
        <MetricCard title="Total Campaigns" value={metrics.total_campaigns.toString()} icon={Megaphone} color="bg-[hsl(var(--metric-blue)/0.15)] text-[hsl(var(--metric-blue))]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Emails Sent Over Time", key: "emails_sent" as const },
          { title: "Replies Over Time", key: "replies" as const },
        ].map((chart) => (
          <Card key={chart.key} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {dailyMetrics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(260 14% 16%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(255 12% 50%)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(255 12% 50%)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(260 18% 10%)", border: "1px solid hsl(260 14% 16%)", borderRadius: "8px", color: "hsl(250 20% 95%)" }} />
                      <Area type="monotone" dataKey={chart.key} stroke={CHART_COLORS[chart.key].stroke} fill={CHART_COLORS[chart.key].fill} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data yet — sync your campaigns to see trends
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
