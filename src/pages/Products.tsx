import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { parseCSV, findHeader, getField } from "@/lib/csvParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Search, Package, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useProducts } from "@/hooks/useProducts";
import { UNITS, CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export default function Products() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<ProductInsert>>({});

  const canManage = role === "admin" || role === "supervisor";

  const { data: products = [] } = useProducts();

  // CSV Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importDuplicates, setImportDuplicates] = useState(0);

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ["Nombre", "Descripción", "Categoría", "Unidad (código)", "Moneda", "Precio"];
    const example = ["Semillas de pino", "Semillas de alta germinación", "Forestal", "kg", "ARS", "4250"];
    const units = ["u=Unidad", "kg=Kilogramo", "tn=Tonelada", "m3=Metro cúbico", "m2=Metro cuadrado", "ml=Metro lineal", "ha=Hectárea", "lt=Litro", "hr=Hora", "servicio=Servicio"];
    const csv = [headers, example].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const notes = `\n\n# Unidades válidas: ${units.join(", ")}`;
    const blob = new Blob(["\ufeff" + csv + notes], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos_mejoracrm.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) return toast.error("El archivo está vacío");

      const nameIdx = findHeader(headers, "nombre", "name");
      if (nameIdx === -1) return toast.error("No se encontró columna 'Nombre'");

      const descIdx = findHeader(headers, "descripción", "descripcion", "description");
      const catIdx = findHeader(headers, "categoría", "categoria", "category");
      const unitIdx = findHeader(headers, "unidad", "unit");
      const currencyIdx = findHeader(headers, "moneda", "currency");
      const priceIdx = findHeader(headers, "precio", "price");

      const existingNames = new Set(products.map((p) => p.name.toLowerCase()));
      const parsed: any[] = [];
      let dupes = 0;

      for (const cols of rows) {
        const name = getField(cols, nameIdx);
        if (!name) continue;

        const unitCode = getField(cols, unitIdx)?.toLowerCase() || "u";
        const unit = UNITS.find((u) => u.value === unitCode);
        const isDupe = existingNames.has(name.toLowerCase());
        if (isDupe) dupes++;

        parsed.push({
          name,
          description: getField(cols, descIdx),
          category: getField(cols, catIdx),
          unit: unit?.value || "u",
          unit_label: unit?.label || "Unidad",
          currency: (getField(cols, currencyIdx)?.toUpperCase() || "ARS") as "ARS" | "USD" | "EUR",
          price: priceIdx >= 0 ? Number(getField(cols, priceIdx)) || null : null,
          active: true,
          isDuplicate: isDupe,
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
      const { error } = await supabase.from("products").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setImportDialogOpen(false);
      setImportPreview([]);
      const count = importPreview.filter((i) => !i.isDuplicate).length;
      toast.success(`${count} producto${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertMutation = useMutation({
    mutationFn: async (p: ProductInsert & { id?: string }) => {
      if (p.id) {
        const { id, ...rest } = p;
        const { error } = await supabase.from("products").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
      setForm({});
      setEditing(null);
      toast.success(editing ? "Producto actualizado" : "Producto creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ unit: "u", unit_label: "Unidad", currency: "ARS", active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    if (!form.unit) return toast.error("La unidad es obligatoria");
    const unit = UNITS.find((u) => u.value === form.unit);
    upsertMutation.mutate({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      description: form.description || null,
      category: form.category || null,
      unit: form.unit,
      unit_label: unit?.label || form.unit_label || "Unidad",
      currency: (form.currency as "ARS" | "USD" | "EUR") || "ARS",
      price: form.price !== undefined && form.price !== null ? Number(form.price) : null,
      active: form.active ?? true,
    } as ProductInsert);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive || p.active;
    return matchSearch && matchActive;
  });

  if (!canManage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Plantilla
          </Button>
          <label>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer" asChild>
              <span><Upload className="h-4 w-4 mr-1" /> Importar</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <Button onClick={openNew} className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo producto
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o categoría..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 border rounded-md h-9">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} id="show-inactive" />
          <Label htmlFor="show-inactive" className="text-xs cursor-pointer">
            Mostrar inactivos
          </Label>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Categoría</TableHead>
                <TableHead className="font-semibold">Unidad</TableHead>
                <TableHead className="font-semibold text-right">Precio</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{p.category || "—"}</TableCell>
                  <TableCell className="text-sm">{p.unit_label}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {p.price != null
                      ? `${CURRENCY_SYMBOLS[p.currency]}${Number(p.price).toLocaleString()}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        p.active
                          ? "bg-success/10 text-success border-success/20 text-xs"
                          : "bg-muted text-muted-foreground border-border text-xs"
                      }
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium text-muted-foreground">Sin productos encontrados</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      {search ? "Probá con otro término de búsqueda" : "Creá tu primer producto para empezar"}
                    </p>
                    {!search && (
                      <Button size="sm" onClick={openNew}>
                        <Plus className="h-4 w-4 mr-1" /> Nuevo producto
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Input
                  value={form.category || ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ej: Madera, Servicios"
                />
              </div>
              <div>
                <Label>Unidad de medida *</Label>
                <Select
                  value={form.unit || "u"}
                  onValueChange={(v) => {
                    const unit = UNITS.find((u) => u.value === v);
                    setForm({ ...form, unit: v, unit_label: unit?.label || v });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label} ({u.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Moneda</Label>
                <Select
                  value={form.currency || "ARS"}
                  onValueChange={(v) => setForm({ ...form, currency: v as "ARS" | "USD" | "EUR" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Precio referencia</Label>
                <Input
                  type="number"
                  value={form.price ?? ""}
                  onChange={(e) => setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
                id="active"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Producto activo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {editing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
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
                Los duplicados (mismo nombre) se marcarán y no se importarán.
              </p>
            )}
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Categoría</TableHead>
                    <TableHead className="text-xs">Unidad</TableHead>
                    <TableHead className="text-xs text-right">Precio</TableHead>
                    <TableHead className="text-xs w-20">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.map((item, i) => (
                    <TableRow key={i} className={item.isDuplicate ? "opacity-40 bg-warning/5" : ""}>
                      <TableCell className="text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm">{item.category || "—"}</TableCell>
                      <TableCell className="text-sm">{item.unit_label}</TableCell>
                      <TableCell className="text-sm text-right">
                        {item.price != null ? `${item.currency} ${Number(item.price).toLocaleString()}` : "—"}
                      </TableCell>
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
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => importMutation.mutate(importPreview)}
              disabled={importMutation.isPending || importPreview.filter((i) => !i.isDuplicate).length === 0}
            >
              <Upload className="h-4 w-4 mr-1" />
              Importar {importPreview.filter((i) => !i.isDuplicate).length} productos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
