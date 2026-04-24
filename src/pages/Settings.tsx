import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, Contact, Save, Link2, Unlink, Bell, BellOff, Download, Smartphone, Trash2, Shield, FileText } from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { isPushSupported, getNotificationPermission, requestNotificationPermission } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function PWAInstallButton() {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isInstalled) {
    return (
      <Badge variant="outline" className="text-xs text-success bg-success/10">
        Instalada
      </Badge>
    );
  }

  if (!isInstallable) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        No disponible
      </Badge>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => install()}>
      Instalar
    </Button>
  );
}

export default function Settings() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
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

      {/* Notificaciones Push */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notificaciones push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Recibí alertas cuando tengas seguimientos vencidos o clientes sin contacto.
          </p>
          {!isPushSupported() ? (
            <p className="text-xs text-muted-foreground">Tu navegador no soporta notificaciones push.</p>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                {getNotificationPermission() === "granted" ? (
                  <Bell className="h-5 w-5 text-success" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {getNotificationPermission() === "granted"
                      ? "Notificaciones activas"
                      : "Notificaciones desactivadas"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getNotificationPermission() === "granted"
                      ? "Recibirás alertas de seguimientos pendientes"
                      : "Activá para recibir alertas importantes"}
                  </p>
                </div>
              </div>
              {getNotificationPermission() !== "granted" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await requestNotificationPermission();
                    if (result === "granted") {
                      toast.success("Notificaciones activadas");
                    } else {
                      toast.error("Permiso denegado");
                    }
                  }}
                >
                  Activar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* App instalable */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Aplicación instalable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Instalar como app</p>
                <p className="text-xs text-muted-foreground">
                  Accedé a MejoraCRM desde tu pantalla de inicio, como una app nativa
                </p>
              </div>
            </div>
            <PWAInstallButton />
          </div>
        </CardContent>
      </Card>

      {/* Cuenta y datos */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Cuenta y datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Documentos legales</p>
                <p className="text-xs text-muted-foreground">
                  Política de privacidad y términos de servicio
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/privacy">Privacidad</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/terms">Términos</Link>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Eliminar mis datos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus clientes, interacciones y datos asociados. Tu perfil será anonimizado.
                </p>
                {deleting ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label className="text-xs">
                        Escribí <strong>ELIMINAR</strong> para confirmar:
                      </Label>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="ELIMINAR"
                        className="h-8 mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={confirmText !== "ELIMINAR"}
                        onClick={async () => {
                          try {
                            const { data, error } = await supabase.rpc("request_account_deletion");
                            if (error) throw error;
                            const result = data as { success: boolean; message?: string; error?: string };
                            if (result?.success) {
                              toast.success(result.message || "Datos eliminados correctamente");
                              await signOut();
                            } else {
                              toast.error(result?.error || "Error al eliminar datos");
                            }
                          } catch (err) {
                            toast.error("Error al eliminar datos");
                            console.error(err);
                          } finally {
                            setDeleting(false);
                            setConfirmText("");
                          }
                        }}
                      >
                        Confirmar eliminación
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleting(false);
                          setConfirmText("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setDeleting(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar mis datos
                  </Button>
                )}
              </div>
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
