import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";

const MEDIUM_LABELS: Record<string, string> = { whatsapp: "WhatsApp", email: "Email", llamada: "Llamada", redes: "Redes", reunion: "Reunión" };
const TYPE_LABELS: Record<string, string> = { consulta: "Consulta", cotizacion: "Cotización", seguimiento: "Seguimiento", cierre: "Cierre" };
const RESULT_LABELS: Record<string, string> = { interes: "Interés", venta: "Venta", sin_respuesta: "Sin respuesta", rechazo: "Rechazo" };

export default function Interactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: interactions = [] } = useQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("interactions")
        .select("*, clients(name), products(name)")
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").order("name");
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("active", true).order("name");
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (interaction: any) => {
      const { error } = await supabase.from("interactions").insert(interaction);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      setDialogOpen(false);
      setForm({});
      toast.success("Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.client_id || !form.medium || !form.type) return toast.error("Completa los campos obligatorios");
    createMutation.mutate({
      ...form,
      user_id: user?.id,
      product_id: form.product_id || null,
      result: form.result || null,
      follow_up_date: form.follow_up_date || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interacciones</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({})}><Plus className="h-4 w-4 mr-1" />Nueva interacción</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar interacción</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Medio *</Label>
                  <Select value={form.medium || ""} onValueChange={(v) => setForm({ ...form, medium: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.interaction_medium.map((m) => (
                        <SelectItem key={m} value={m}>{MEDIUM_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.type || ""} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.interaction_type.map((t) => (
                        <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Producto</Label>
                <Select value={form.product_id || ""} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={form.result || ""} onValueChange={(v) => setForm({ ...form, result: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.interaction_result.map((r) => (
                      <SelectItem key={r} value={r}>{RESULT_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Próximo paso</Label><Input value={form.next_step || ""} onChange={(e) => setForm({ ...form, next_step: e.target.value })} /></div>
              <div><Label>Fecha de seguimiento</Label><Input type="date" value={form.follow_up_date || ""} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
              <div><Label>Observaciones</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {interactions.map((i: any) => (
          <Card key={i.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{i.clients?.name}</span>
                    <Badge variant="outline">{MEDIUM_LABELS[i.medium]}</Badge>
                    <Badge variant="secondary">{TYPE_LABELS[i.type]}</Badge>
                  </div>
                  {i.products?.name && <p className="text-sm text-muted-foreground">Producto: {i.products.name}</p>}
                  {i.result && <Badge variant="outline">{RESULT_LABELS[i.result]}</Badge>}
                  {i.next_step && <p className="text-sm">→ {i.next_step}</p>}
                  {i.notes && <p className="text-sm text-muted-foreground">{i.notes}</p>}
                </div>
                <div className="text-right text-sm text-muted-foreground shrink-0">
                  <p>{new Date(i.interaction_date).toLocaleDateString()}</p>
                  {i.follow_up_date && <p className="text-xs">Seguimiento: {i.follow_up_date}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {interactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Sin interacciones registradas</div>
        )}
      </div>
    </div>
  );
}
