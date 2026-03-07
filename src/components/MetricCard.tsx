import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export function MetricCard({ title, value, icon: Icon, color, subtitle }: MetricCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 hover:glow-sm group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
