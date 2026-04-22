import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Pencil, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

const STATUS_LABELS: Record<string, string> = { activo: "Activo", potencial: "Potencial", inactivo: "Inactivo" };
const STATUS_STYLES: Record<string, string> = {
  activo: "bg-success/10 text-success border-success/20",
  potencial: "bg-primary/10 text-primary border-primary/20",
  inactivo: "bg-muted text-muted-foreground border-border",
};

const CHANNELS = ["WhatsApp", "Email", "Redes sociales", "Referido", "Teléfono", "Feria/Evento", "Sitio web"];
const RUBROS = ["Forestal", "Agropecuario", "Industrial", "Construcción", "Gobierno", "Particular", "Comercio", "Otro"];

const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

const MEDIUM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", llamada: "Llamada", email: "Email",
  reunion_presencial: "R. presencial", reunion_virtual: "R. virtual",
  md_instagram: "Instagram", md_facebook: "Facebook", md_linkedin: "LinkedIn",
  visita_campo: "Visita campo",
};
const RESULT_LABELS: Record<string, string> = {
  presupuesto: "Envié un presupuesto", venta: "Cerré una venta", seguimiento: "Hice un seguimiento",
  sin_respuesta: "Sin respuesta", no_interesado: "No le interesó",
};
const RESULT_STYLES: Record<string, string> = {
  presupuesto: "bg-primary/10 text-primary border-primary/20",
  venta: "bg-success/10 text-success border-success/20",
  seguimiento: "bg-accent/20 text-accent-foreground border-accent/30",
  sin_respuesta: "bg-muted text-muted-foreground border-border",
  no_interesado: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Clients() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<ClientInsert>>({});

  const canDelete = role === "admin";

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*").order("name");
      return data || [];
    },
  });

  const { data: clientInteractions = [] } = useQuery({
    queryKey: ["client-interactions", detailClient?.id],
    enabled: !!detailClient,
    queryFn: async () => {
      const { data } = await supabase
        .from("interactions")
        .select("*, interaction_lines(quantity, unit_price, line_total, products(name, unit_label))")
        .eq("client_id", detailClient!.id)
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (c: ClientInsert & { id?: string }) => {
      if (c.id) {
        const { id, ...rest } = c;
        const { error } = await supabase.from("clients").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(c);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setForm({});
      setEditing(null);
      toast.success(editing ? "Cliente actualizado" : "Cliente creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ assigned_to: user?.id });
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ ...c });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    upsertMutation.mutate({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      company: form.company || null,
      contact_name: form.contact_name || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      segment: form.segment || null,
      channel: form.channel || null,
      address: form.address || null,
      province: form.province || null,
      location: form.location || null,
      notes: form.notes || null,
      assigned_to: form.assigned_to || user?.id,
    } as ClientInsert);
  };

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      false;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchProvince = provinceFilter === "all" || c.province === provinceFilter;
    return matchSearch && matchStatus && matchProvince;
  });

  const statusCounts: Record<string, number> = {
    all: clients.length,
    activo: clients.filter((c) => c.status === "activo").length,
    potencial: clients.filter((c) => c.status === "potencial").length,
    inactivo: clients.filter((c) => c.status === "inactivo").length,
  };

  const fmtMoney = (i: any) =>
    i.total_amount ? `${i.currency || ""} ${Number(i.total_amount).toLocaleString()}` : null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} registros</p>
        </div>
        <Button onClick={openNew} className="h-9">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo cliente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o empresa..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Provincia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las provincias</SelectItem>
            {PROVINCIAS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          {(["all", "activo", "potencial", "inactivo"] as const).map((s) => (
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

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Empresa / Rubro</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">Provincia</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="w-20"></TableHead>
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
                      {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    <div>
                      {c.company && <p>{c.company}</p>}
                      {c.segment && <p className="text-xs text-muted-foreground">{c.segment}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c.province || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailClient(c);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    Sin clientes encontrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre y Apellido *</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre y apellido del cliente"
              />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsapp || ""}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+54..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Rubro</Label>
                <Select value={form.segment || ""} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {RUBROS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Canal de Ingreso</Label>
                <Select value={form.channel || ""} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provincia</Label>
                <Select value={form.province || ""} onValueChange={(v) => setForm({ ...form, province: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCIAS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Localidad</Label>
                <Input
                  value={form.location || ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ciudad / pueblo"
                />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailClient} onOpenChange={(o) => !o && setDetailClient(null)}>
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {detailClient.whatsapp && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {detailClient.whatsapp}
                  </div>
                )}
                {detailClient.email && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {detailClient.email}
                  </div>
                )}
                {(detailClient.location || detailClient.province) && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {[detailClient.location, detailClient.province].filter(Boolean).join(", ")}
                  </div>
                )}
                {detailClient.segment && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {detailClient.segment}
                  </div>
                )}
              </div>

              {detailClient.address && (
                <p className="text-xs text-muted-foreground">{detailClient.address}</p>
              )}
              {detailClient.notes && (
                <p className="text-sm bg-accent/10 p-3 rounded-lg border border-accent/20">{detailClient.notes}</p>
              )}

              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Historial de interacciones ({clientInteractions.length})
                </h3>
                {clientInteractions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Sin interacciones registradas</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {clientInteractions.map((i: any) => (
                      <div key={i.id} className="border rounded-lg p-3 text-sm space-y-1.5 hover:bg-muted/20">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result]}`}>
                              {RESULT_LABELS[i.result]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {MEDIUM_LABELS[i.medium]}
                            </Badge>
                            {fmtMoney(i) && <span className="text-xs font-semibold">{fmtMoney(i)}</span>}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(i.interaction_date).toLocaleDateString()}
                          </span>
                        </div>
                        {i.interaction_lines?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {i.interaction_lines
                              .map((l: any) => `${l.products?.name} x${l.quantity}`)
                              .join(", ")}
                          </p>
                        )}
                        {i.followup_motive && (
                          <p className="text-xs italic">"{i.followup_motive}"</p>
                        )}
                        {i.loss_reason && (
                          <p className="text-xs text-destructive">Motivo: {i.loss_reason}</p>
                        )}
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
