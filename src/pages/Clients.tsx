import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

const STATUS_LABELS: Record<string, string> = { lead: "Lead", cliente: "Cliente", inactivo: "Inactivo" };
const STATUS_COLORS: Record<string, string> = { lead: "bg-blue-100 text-blue-800", cliente: "bg-green-100 text-green-800", inactivo: "bg-gray-100 text-gray-800" };
const CHANNELS = ["WhatsApp", "Email", "Redes sociales", "Referido", "Teléfono", "Feria/Evento", "Sitio web"];
const SEGMENTS = ["Forestal", "Agropecuario", "Industrial", "Gobierno", "Particular"];

export default function Clients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Partial<ClientInsert>>({});

  const { data: clients = [], isLoading } = useQuery({
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditClient({})}><Plus className="h-4 w-4 mr-1" />Nuevo cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input value={editClient.name || ""} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} /></div>
              <div><Label>Empresa</Label><Input value={editClient.company || ""} onChange={(e) => setEditClient({ ...editClient, company: e.target.value })} /></div>
              <div><Label>Contacto</Label><Input value={editClient.contact_name || ""} onChange={(e) => setEditClient({ ...editClient, contact_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input value={editClient.whatsapp || ""} onChange={(e) => setEditClient({ ...editClient, whatsapp: e.target.value })} /></div>
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
              <div><Label>Ubicación</Label><Input value={editClient.location || ""} onChange={(e) => setEditClient({ ...editClient, location: e.target.value })} /></div>
              <div><Label>Observaciones</Label><Textarea value={editClient.notes || ""} onChange={(e) => setEditClient({ ...editClient, notes: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Crear cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Segmento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.company || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.segment || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{c.whatsapp || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDetailClient(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin clientes</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <Dialog open={!!detailClient} onOpenChange={(open) => !open && setDetailClient(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detailClient?.name}</DialogTitle></DialogHeader>
          {detailClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Empresa:</span> {detailClient.company || "—"}</div>
                <div><span className="text-muted-foreground">Segmento:</span> {detailClient.segment || "—"}</div>
                <div><span className="text-muted-foreground">WhatsApp:</span> {detailClient.whatsapp || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {detailClient.email || "—"}</div>
                <div><span className="text-muted-foreground">Ubicación:</span> {detailClient.location || "—"}</div>
                <div><span className="text-muted-foreground">Canal:</span> {detailClient.channel || "—"}</div>
              </div>
              {detailClient.notes && <p className="text-sm bg-muted p-3 rounded">{detailClient.notes}</p>}
              <div>
                <h3 className="font-semibold mb-2">Historial de interacciones</h3>
                {clientInteractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin interacciones registradas</p>
                ) : (
                  <div className="space-y-2">
                    {clientInteractions.map((i: any) => (
                      <div key={i.id} className="border rounded p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <Badge variant="outline">{MEDIUM_LABELS[i.medium] || i.medium}</Badge>
                          <span className="text-muted-foreground">{new Date(i.interaction_date).toLocaleDateString()}</span>
                        </div>
                        <p><span className="text-muted-foreground">Tipo:</span> {TYPE_LABELS[i.type] || i.type}</p>
                        {i.products?.name && <p><span className="text-muted-foreground">Producto:</span> {i.products.name}</p>}
                        {i.notes && <p className="text-muted-foreground">{i.notes}</p>}
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
