import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Pipeline() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Próximamente</p>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Construction className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Esta vista será reemplazada en la nueva versión del CRM.</p>
        </CardContent>
      </Card>
    </div>
  );
}
