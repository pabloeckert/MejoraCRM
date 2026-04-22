import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, Contact, Save, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [exchangeRate, setExchangeRate] = useState(() => {
    return localStorage.getItem("mejoracrm_exchange_rate") || "1200";
  });
  const [exchangeBase, setExchangeBase] = useState(() => {
    return localStorage.getItem("mejoracrm_exchange_base") || "ARS";
  });
  const [calendarConnected, setCalendarConnected] = useState(
    localStorage.getItem("mejoracrm_calendar_connected") === "true"
  );
  const [contactsConnected, setContactsConnected] = useState(
    localStorage.getItem("mejoracrm_contacts_connected") === "true"
  );

  const handleSaveExchange = () => {
    localStorage.setItem("mejoracrm_exchange_rate", exchangeRate);
    localStorage.setItem("mejoracrm_exchange_base", exchangeBase);
    toast.success("Tipo de cambio guardado");
  };

  const handleConnectCalendar = () => {
    // Preparado para integración con Google Calendar OAuth
    // Cuando se implemente, esto abrirá el flujo OAuth
    toast.info("Integración con Google Calendar próximamente disponible");
  };

  const handleConnectContacts = () => {
    // Preparado para integración con Google Contacts OAuth
    toast.info("Integración con Google Contacts próximamente disponible");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes generales del sistema</p>
      </div>

      {/* Tipo de cambio */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Tipo de cambio de referencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Usado para mostrar una vista consolidada aproximada cuando hay ventas en múltiples monedas.
            No afecta los valores originales de cada transacción.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>1 USD equivale a</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="h-9"
                />
                <Select value={exchangeBase} onValueChange={setExchangeBase}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveExchange} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </CardContent>
      </Card>

      {/* Integraciones */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Integraciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Google Calendar</p>
                <p className="text-xs text-muted-foreground">
                  Sincroniza fechas de seguimiento como eventos en tu calendario
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {calendarConnected ? (
                <>
                  <Badge variant="outline" className="text-xs text-success bg-success/10">Conectado</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("mejoracrm_calendar_connected");
                      setCalendarConnected(false);
                      toast.success("Desconectado de Google Calendar");
                    }}
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnectCalendar}>
                  Conectar
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Google Contacts */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Contact className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Google Contacts</p>
                <p className="text-xs text-muted-foreground">
                  Importa contactos directamente desde tu cuenta de Google
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {contactsConnected ? (
                <>
                  <Badge variant="outline" className="text-xs text-success bg-success/10">Conectado</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("mejoracrm_contacts_connected");
                      setContactsConnected(false);
                      toast.success("Desconectado de Google Contacts");
                    }}
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnectContacts}>
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info del sistema */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Información del sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Versión</span>
            <span className="font-medium">2.0</span>
            <span className="text-muted-foreground">Plataforma</span>
            <span className="font-medium">Mejora Continua® + Supabase</span>
            <span className="text-muted-foreground">Empresa</span>
            <span className="font-medium">Mejora Continua</span>
            <span className="text-muted-foreground">Dominio</span>
            <span className="font-medium">mejoraok.com</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
