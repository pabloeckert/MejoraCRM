import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
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
import { Plus, Pencil, Search, Package } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useProducts } from "@/hooks/useProducts";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

const UNITS: { value: string; label: string }[] = [
  { value: "u", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "tn", label: "Tonelada" },
  { value: "m3", label: "Metro cúbico" },
  { value: "m2", label: "Metro cuadrado" },
  { value: "ml", label: "Metro lineal" },
  { value: "ha", label: "Hectárea" },
  { value: "lt", label: "Litro" },
  { value: "hr", label: "Hora" },
  { value: "servicio", label: "Servicio" },
];

const CURRENCIES: ("ARS" | "USD" | "EUR")[] = ["ARS", "USD", "EUR"];
const CURRENCY_SYMBOLS: Record<string, string> = { ARS: "$", USD: "USD", EUR: "€" };

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
        <Button onClick={openNew} className="h-9">
          <Plus className="h-4 w-4 mr-1" /> Nuevo producto
        </Button>
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
    </div>
  );
}
