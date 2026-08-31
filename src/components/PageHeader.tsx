import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Reports usa "start" porque sus acciones (Select + botones) envuelven en mobile. */
  align?: "center" | "start";
}

export function PageHeader({ title, subtitle, actions, align = "center" }: PageHeaderProps) {
  return (
    <div className={`flex ${align === "start" ? "items-start" : "items-center"} justify-between flex-wrap gap-3`}>
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
