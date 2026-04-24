import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle, Phone, Mail, Globe, Video, AlertCircle,
  FileText, ShoppingCart, Clock, X,
} from "lucide-react";
import { isBefore, differenceInDays } from "date-fns";
import { Constants } from "@/integrations/supabase/types";

type Result = "presupuesto" | "venta" | "seguimiento" | "sin_respuesta" | "no_interesado";

const MEDIUM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", llamada: "Llamada", email: "Email",
  reunion_presencial: "Reunión presencial", reunion_virtual: "Reunión virtual",
  md_instagram: "MD Instagram", md_facebook: "MD Facebook", md_linkedin: "MD LinkedIn", visita_campo: "Visita a campo",
};

const MEDIUM_ICONS: Record<string, any> = {
  whatsapp: MessageCircle, llamada: Phone, email: Mail,
  reunion_presencial: Video, reunion_virtual: Video,
  md_instagram: Globe, md_facebook: Globe, md_linkedin: Globe, visita_campo: Globe,
};

const RESULT_LABELS: Record<Result, string> = {
  presupuesto: "Envié un presupuesto", venta: "Cerré una venta",
  seguimiento: "Hice un seguimiento", sin_respuesta: "Sin respuesta", no_interesado: "No le interesó",
};

const RESULT_STYLES: Record<Result, string> = {
  presupuesto: "bg-primary/10 text-primary border-primary/20",
  venta: "bg-success/10 text-success border-success/20",
  seguimiento: "bg-accent/20 text-accent-foreground border-accent/30",
  sin_respuesta: "bg-muted text-muted-foreground border-border",
  no_interesado: "bg-destructive/10 text-destructive border-destructive/20",
};

const RESULT_ICONS: Record<Result, any> = {
  presupuesto: FileText, venta: ShoppingCart, seguimiento: Clock, sin_respuesta: AlertCircle, no_interesado: X,
};

interface InteractionCardProps {
  interaction: any;
  index: number;
  onNavigate: (path: string) => void;
}

export function InteractionCard({ interaction: i, index, onNavigate }: InteractionCardProps) {
  const MediumIcon = MEDIUM_ICONS[i.medium] || MessageCircle;
  const ResultIcon = RESULT_ICONS[i.result as Result] || FileText;
  const isOverdue = i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date());
  const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date)) : 0;

  return (
    <Card
      className={`border-border/50 hover:shadow-sm transition-all duration-200 animate-fade-in ${
        isOverdue ? "border-l-2 border-l-destructive" : ""
      }`}
      style={{ animationDelay: `${index * 0.02}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${RESULT_STYLES[i.result as Result]}`}>
            <ResultIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => onNavigate("/clients")}
              >
                {i.clients?.name}
              </span>
              <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result as Result]}`}>
                {RESULT_LABELS[i.result as Result]}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MediumIcon className="h-3 w-3" />
                {MEDIUM_LABELS[i.medium]}
              </span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {daysOverdue}d vencido
                </Badge>
              )}
            </div>
            {i.total_amount && (
              <p className="text-sm font-semibold mt-1">{i.currency} {Number(i.total_amount).toLocaleString()}</p>
            )}
            {i.interaction_lines?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {i.interaction_lines.length} producto(s):{" "}
                {i.interaction_lines.map((l: any) => l.products?.name).filter(Boolean).join(", ")}
              </p>
            )}
            {i.followup_motive && <p className="text-xs mt-1 italic">"{i.followup_motive}"</p>}
            {i.loss_reason && <p className="text-xs text-destructive mt-1 italic">Motivo: {i.loss_reason}</p>}
            {i.next_step && <p className="text-sm mt-1">→ {i.next_step}</p>}
            {i.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.notes}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{new Date(i.interaction_date).toLocaleDateString()}</p>
            {i.follow_up_date && (
              <p className={`text-xs mt-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                Seg: {i.follow_up_date}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { RESULT_LABELS, RESULT_STYLES, RESULT_ICONS, MEDIUM_LABELS, MEDIUM_ICONS };
export type { Result };
