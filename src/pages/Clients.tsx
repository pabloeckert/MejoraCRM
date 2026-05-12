import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { parseCSV, findHeader, getField } from "@/lib/csvParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Pencil, Phone, Mail, MapPin, Building2, Upload, Download, FileSpreadsheet, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ListSkeleton } from "@/components/skeletons";
import { useAllClients } from "@/hooks/useClients";
import { useAllInteractions } from "@/hooks/useInteractions";
import { exportClientsExcel } from "@/lib/excelExport";
import {
  STATUS_LABELS, STATUS_STYLES, MEDIUM_LABELS, RESULT_LABELS, RESULT_STYLES,
  CHANNELS, RUBROS, PAISES, PROVINCIAS,
} from "@/lib/constants";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importDuplicates, setImportDuplicates] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clients = [], isLoading, error, refetch } = useAllClients();

  // Client-specific interactions (for detail view)
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

  // Validación WhatsApp: acepta formato internacional (+XX XXXXXXXXX o similar)
  const whatsappValid = !form.whatsapp || /^\+?\d[\d\s\-()]{6,20}$/.test(form.whatsapp);

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    if (form.whatsapp && !whatsappValid) return toast.error("Formato de WhatsApp inválido. Usá: +54 376 4000000");
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
      country: form.country || "Argentina",
      location: form.location || null,
      notes: form.notes || null,
      assigned_to: form.assigned_to || user?.id,
    } as ClientInsert);
  };

  // Exportar contactos a CSV (respeta filtros activos)
  const handleExport = () => {
    const headers = ["Nombre", "Empresa", "WhatsApp", "Email", "Rubro", "Canal de Ingreso", "País", "Provincia", "Localidad", "Dirección", "Estado", "Observaciones"];
    const rows = filtered.map((c) => [
      c.name, c.company || "", c.whatsapp || "", c.email || "",
      c.segment || "", c.channel || "", c.country || "Argentina", c.province || "", c.location || "",
      c.address || "", c.status, c.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_mejoracrm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportados ${filtered.length} clientes`);
  };

  // Exportar contactos a PDF (abre ventana imprimible)
  const handleExportPDF = () => {
    const rows = filtered.map((c) => `
      <tr>
        <td>${c.name}</td>
        <td>${c.company || "—"}</td>
        <td>${c.whatsapp || "—"}</td>
        <td>${c.segment || "—"}</td>
        <td>${c.country || "Argentina"}</td>
        <td>${c.province || "—"}</td>
        <td>${c.status}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Clientes - MejoraCRM</title>
<style>
  body{font-family:Arial,sans-serif;padding:20px;color:#1a1a1a}
  h1{color:#8B2D6B;font-size:18px;margin-bottom:4px}
  p.sub{color:#656565;font-size:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#8B2D6B;color:#fff;padding:8px;text-align:left}
  td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
  tr:nth-child(even){background:#f9f9f9}
  .badge{padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600}
  .activo{background:#e8f5e9;color:#2e7d32}
  .potencial{background:#e3f2fd;color:#1565c0}
  .inactivo{background:#f5f5f5;color:#616161}
  @media print{body{padding:0}}
</style></head><body>
<h1>Clientes — MejoraCRM</h1>
<p class="sub">Exportado: ${new Date().toLocaleDateString("es-AR")} · ${filtered.length} registros</p>
<table><thead><tr><th>Nombre</th><th>Empresa</th><th>WhatsApp</th><th>Rubro</th><th>País</th><th>Provincia</th><th>Estado</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  };

  // Importar contactos desde CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) return toast.error("El archivo está vacío");

      const nameIdx = findHeader(headers, "nombre", "name");
      if (nameIdx === -1) return toast.error("No se encontró columna 'Nombre'");

      const waIdx = findHeader(headers, "whatsapp", "teléfono", "telefono", "phone");
      const emailIdx = findHeader(headers, "email", "correo");
      const companyIdx = findHeader(headers, "empresa", "company");
      const segmentIdx = findHeader(headers, "rubro", "segmento", "segment");
      const provinceIdx = findHeader(headers, "provincia", "province");
      const channelIdx = findHeader(headers, "canal", "channel");
      const locationIdx = findHeader(headers, "localidad", "ciudad", "location");
      const addressIdx = findHeader(headers, "dirección", "direccion", "address");
      const countryIdx = findHeader(headers, "país", "pais", "country");
      const notesIdx = findHeader(headers, "observaciones", "notas", "notes");

      const parsed: any[] = [];
      const existingNames = new Set(clients.map((c) => c.name.toLowerCase()));
      const existingWhatsapps = new Set(clients.map((c) => c.whatsapp?.toLowerCase()).filter(Boolean));
      let dupes = 0;

      for (const cols of rows) {
        const name = getField(cols, nameIdx);
        if (!name) continue;
        const whatsapp = getField(cols, waIdx);
        const isDupe = existingNames.has(name.toLowerCase()) || (whatsapp && existingWhatsapps.has(whatsapp.toLowerCase()));
        if (isDupe) dupes++;
        parsed.push({
          name,
          company: getField(cols, companyIdx),
          whatsapp: whatsapp || null,
          email: getField(cols, emailIdx),
          segment: getField(cols, segmentIdx),
          channel: getField(cols, channelIdx),
          province: getField(cols, provinceIdx),
          location: getField(cols, locationIdx),
          address: getField(cols, addressIdx),
          country: getField(cols, countryIdx) || "Argentina",
          notes: getField(cols, notesIdx),
          isDuplicate: isDupe,
          assigned_to: user?.id,
          status: "potencial" as const,
        });
      }
      setImportPreview(parsed);
      setImportDuplicates(dupes);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const toInsert = items.filter((i) => !i.isDuplicate).map(({ isDuplicate, ...rest }) => rest);
      if (toInsert.length === 0) return;
      const { error } = await supabase.from("clients").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setImportDialogOpen(false);
      setImportPreview([]);
      toast.success(`${importPreview.filter((i) => !i.isDuplicate).length} clientes importados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-3 rounded-full bg-destructive/10"><AlertCircle className="h-8 w-8 text-destructive" /></div>
        <div>
          <h2 className="text-lg font-semibold">Error al cargar clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" /> Reintentar</Button>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportClientsExcel(filtered)}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <label>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </span>
            </Button>
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button onClick={openNew} className="h-9">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo cliente
          </Button>
        </div>
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
                  placeholder="+54 376 4000000"
                  className={form.whatsapp && !whatsappValid ? "border-destructive" : ""}
                />
                {form.whatsapp && !whatsappValid && (
                  <p className="text-xs text-destructive mt-1">Formato: +54 376 4000000</p>
                )}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>País</Label>
                <Select value={form.country || "Argentina"} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dirección</Label>
                <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
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
                {(detailClient.location || detailClient.province || detailClient.country) && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {[detailClient.location, detailClient.province, detailClient.country].filter(Boolean).join(", ")}
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

      {/* Import preview dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Previsualizar importación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3 text-sm">
              <Badge variant="outline" className="bg-success/10 text-success">
                {importPreview.filter((i) => !i.isDuplicate).length} nuevos
              </Badge>
              {importDuplicates > 0 && (
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  {importDuplicates} posibles duplicados
                </Badge>
              )}
            </div>
            {importDuplicates > 0 && (
              <p className="text-xs text-muted-foreground">
                Los duplicados (mismo nombre o WhatsApp) se marcarán y no se importarán.
              </p>
            )}
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">WhatsApp</TableHead>
                    <TableHead className="text-xs">Rubro</TableHead>
                    <TableHead className="text-xs">País</TableHead>
                    <TableHead className="text-xs">Provincia</TableHead>
                    <TableHead className="text-xs w-20">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.map((item, i) => (
                    <TableRow key={i} className={item.isDuplicate ? "opacity-40 bg-warning/5" : ""}>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.whatsapp || "—"}</TableCell>
                      <TableCell className="text-sm">{item.segment || "—"}</TableCell>
                      <TableCell className="text-sm">{item.country || "Argentina"}</TableCell>
                      <TableCell className="text-sm">{item.province || "—"}</TableCell>
                      <TableCell>
                        {item.isDuplicate ? (
                          <Badge variant="outline" className="text-xs text-warning">Dup</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-success">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => importMutation.mutate(importPreview)}
              disabled={importMutation.isPending || importPreview.filter((i) => !i.isDuplicate).length === 0}
            >
              <Upload className="h-4 w-4 mr-1" />
              Importar {importPreview.filter((i) => !i.isDuplicate).length} clientes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
