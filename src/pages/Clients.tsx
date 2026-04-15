import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, MessageSquare, Kanban, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

const STATUS_LABELS: Record<string, string> = { lead: "Lead", cliente: "Cliente", inactivo: "Inactivo" };
const STATUS_STYLES: Record<string, string> = {
  lead: "bg-primary/10 text-primary border-primary/20",
  cliente: "bg-success/10 text-success border-success/20",
  inactivo: "bg-muted text-muted-foreground border-border",
};
const CHANNELS = ["WhatsApp", "Email", "Redes sociales", "Referido", "Teléfono", "Feria/Evento", "Sitio web"];
const SEGMENTS = ["Forestal", "Agropecuario", "Industrial", "Gobierno", "Particular"];

export default function Clients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Partial<ClientInsert>>({});

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: clientInteractions = [] } = useQuery({
    queryKey: ["client-interactions", detailClient?.id],
    enabled: !!detailClient,
    queryFn: async () => {
      const { data } = await supabase
        .from("interactions")
        .select("*, products(name)")
        .eq("client_id", detailClient!.id)
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  const { data: clientOpportunities = [] } = useQuery({
    queryKey: ["client-opportunities", detailClient?.id],
    enabled: !!detailClient,
    queryFn: async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, products(name)")
        .eq("client_id", detailClient!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (client: ClientInsert) => {
      const { error } = await supabase.from("clients").insert(client);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setEditClient({});
      toast.success("Cliente creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = () => {
    if (!editClient.name) return toast.error("El nombre es obligatorio");
    createMutation.mutate({ ...editClient, name: editClient.name!, assigned_to: user?.id } as ClientInsert);
  };

  const MEDIUM_LABELS: Record<string, string> = { whatsapp: "WhatsApp", email: "Email", llamada: "Llamada", redes: "Redes", reunion: "Reunión" };
  const TYPE_LABELS: Record<string, string> = { consulta: "Consulta", cotizacion: "Cotización", seguimiento: "Seguimiento", cierre: "Cierre" };
  const RESULT_LABELS: Record<string, string> = { interes: "Interés", venta: "Venta", sin_respuesta: "Sin respuesta", rechazo: "Rechazo" };
  const STAGE_LABELS: Record<string, string> = { prospecto: "Prospecto", contactado: "Contactado", cotizacion: "Cotización", negociacion: "Negociación", cerrado_ganado: "Ganado", cerrado_perdido: "Perdido" };

  const statusCounts = {
    all: clients.length,
    lead: clients.filter((c) => c.status === "lead").length,
    cliente: clients.filter((c) => c.status === "cliente").length,
    inactivo: clients.filter((c) => c.status === "inactivo").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} registros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditClient({})} className="h-9">
              <Plus className="h-4 w-4 mr-1" />Nuevo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input value={editClient.name || ""} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} placeholder="Nombre del cliente o empresa" /></div>
              <div><Label>Empresa</Label><Input value={editClient.company || ""} onChange={(e) => setEditClient({ ...editClient, company: e.target.value })} /></div>
              <div><Label>Contacto</Label><Input value={editClient.contact_name || ""} onChange={(e) => setEditClient({ ...editClient, contact_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={editClient.whatsapp || ""} onChange={(e) => setEditClient({ ...editClient, whatsapp: e.target.value })} placeholder="+54..." /></div>
                <div><Label>Email</Label><Input value={editClient.email || ""} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Segmento</Label>
                  <Select value={editClient.segment || ""} onValueChange={(v) => setEditClient({ ...editClient, segment: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Canal</Label>
                  <Select value={editClient.channel || ""} onValueChange={(v) => setEditClient({ ...editClient, channel: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Ubicación</Label><Input value={editClient.location || ""} onChange={(e) => setEditClient({ ...editClient, location: e.target.value })} placeholder="Provincia / Ciudad" /></div>
              <div><Label>Observaciones</Label><Textarea value={editClient.notes || ""} onChange={(e) => setEditClient({ ...editClient, notes: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Crear cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o empresa..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(["all", "lead", "cliente", "inactivo"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s]} ({statusCounts[s]})
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Empresa</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">Segmento</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">Ubicación</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 0.02}s` }}
                  onClick={() => setDetailClient(c)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      {c.whatsapp && <p className="text-xs text-muted-foreground">{c.whatsapp}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{c.company || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c.segment || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c.location || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDetailClient(c); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Sin clientes encontrados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!detailClient} onOpenChange={(open) => !open && setDetailClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailClient && (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-lg">{detailClient.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{detailClient.company || "Sin empresa"}</p>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[detailClient.status]}>
                  {STATUS_LABELS[detailClient.status]}
                </Badge>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {detailClient.whatsapp && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />{detailClient.whatsapp}
                  </div>
                )}
                {detailClient.email && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{detailClient.email}
                  </div>
                )}
                {detailClient.location && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{detailClient.location}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2.5 bg-muted/30 rounded-lg"><span className="text-muted-foreground text-xs block">Segmento</span>{detailClient.segment || "—"}</div>
                <div className="p-2.5 bg-muted/30 rounded-lg"><span className="text-muted-foreground text-xs block">Canal</span>{detailClient.channel || "—"}</div>
                <div className="p-2.5 bg-muted/30 rounded-lg"><span className="text-muted-foreground text-xs block">Primer contacto</span>{detailClient.first_contact_date || "—"}</div>
              </div>

              {detailClient.notes && <p className="text-sm bg-accent/10 p-3 rounded-lg border border-accent/20">{detailClient.notes}</p>}

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setDetailClient(null); navigate("/interactions"); }}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Ver interacciones
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDetailClient(null); navigate("/pipeline"); }}>
                  <Kanban className="h-3.5 w-3.5 mr-1" /> Ver pipeline
                </Button>
              </div>

              {/* Opportunities */}
              {clientOpportunities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Oportunidades ({clientOpportunities.length})</h3>
                  <div className="space-y-2">
                    {clientOpportunities.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between p-2.5 border rounded-lg text-sm">
                        <div>
                          <Badge variant="outline" className="text-xs mr-2">{STAGE_LABELS[o.stage]}</Badge>
                          {o.products?.name || "Sin producto"}
                        </div>
                        {o.estimated_amount && <span className="font-semibold">${Number(o.estimated_amount).toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interaction history */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Historial de interacciones ({clientInteractions.length})</h3>
                {clientInteractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin interacciones registradas</p>
                ) : (
                  <div className="space-y-2">
                    {clientInteractions.map((i: any) => (
                      <div key={i.id} className="border rounded-lg p-3 text-sm space-y-1.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-xs">{MEDIUM_LABELS[i.medium]}</Badge>
                            <Badge variant="secondary" className="text-xs">{TYPE_LABELS[i.type]}</Badge>
                            {i.result && <Badge variant="outline" className="text-xs">{RESULT_LABELS[i.result]}</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(i.interaction_date).toLocaleDateString()}</span>
                        </div>
                        {i.products?.name && <p className="text-muted-foreground text-xs">Producto: {i.products.name}</p>}
                        {i.next_step && <p className="text-xs">→ {i.next_step}</p>}
                        {i.notes && <p className="text-xs text-muted-foreground">{i.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
