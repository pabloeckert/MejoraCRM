import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  onClick?: () => void;
  index?: number;
}

export const KPICard = memo(function KPICard({ label, value, sub, icon: Icon, onClick, index = 0 }: KPICardProps) {
  return (
    <Card
      className={`animate-slide-up stagger-${index + 1} opacity-0 cursor-pointer hover:shadow-md transition-all duration-200 group border-border/50`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
});
