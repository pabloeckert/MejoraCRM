import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type OpportunityStage = Database["public"]["Enums"]["opportunity_stage"];

const STAGES: { key: OpportunityStage; label: string; color: string }[] = [
  { key: "prospecto", label: "Prospecto", color: "bg-gray-100" },
  { key: "contactado", label: "Contactado", color: "bg-blue-50" },
  { key: "cotizacion", label: "Cotización", color: "bg-yellow-50" },
  { key: "negociacion", label: "Negociación", color: "bg-orange-50" },
  { key: "cerrado_ganado", label: "Ganado ✓", color: "bg-green-50" },
  { key: "cerrado_perdido", label: "Perdido ✗", color: "bg-red-50" },
];

export default function Pipeline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ id: string; stage: OpportunityStage } | null>(null);
  const [lossReason, setLossReason] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await supabase.from("opportunities").select("*, clients(name), products(name)").order("created_at");
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

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage, loss_reason }: { id: string; stage: OpportunityStage; loss_reason?: string }) => {
      const update: any = { stage };
      if (loss_reason) update.loss_reason = loss_reason;
      const { error } = await supabase.from("opportunities").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: async (opp: any) => {
      const { error } = await supabase.from("opportunities").insert(opp);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      setDialogOpen(false);
      setForm({});
      toast.success("Oportunidad creada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStage = result.destination.droppableId as OpportunityStage;
    const oppId = result.draggableId;
    if (newStage === "cerrado_perdido") {
      setPendingMove({ id: oppId, stage: newStage });
      setLossDialogOpen(true);
    } else {
      updateStageMutation.mutate({ id: oppId, stage: newStage });
    }
  };

  const confirmLoss = () => {
    if (!lossReason.trim()) return toast.error("Indica el motivo de pérdida");
    if (pendingMove) {
      updateStageMutation.mutate({ id: pendingMove.id, stage: pendingMove.stage, loss_reason: lossReason });
    }
    setLossDialogOpen(false);
    setLossReason("");
    setPendingMove(null);
  };

  const handleCreate = () => {
    if (!form.client_id) return toast.error("Selecciona un cliente");
    createMutation.mutate({
      client_id: form.client_id,
      product_id: form.product_id || null,
      estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : null,
      assigned_to: user?.id,
      stage: "prospecto",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({})}><Plus className="h-4 w-4 mr-1" />Nueva oportunidad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva oportunidad</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Producto</Label>
                <Select value={form.product_id || ""} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Monto estimado</Label><Input type="number" value={form.estimated_amount || ""} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageOpps = opportunities.filter((o: any) => o.stage === stage.key);
            return (
              <Droppable key={stage.key} droppableId={stage.key}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[220px] w-[220px] rounded-lg p-3 ${stage.color} shrink-0`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">{stage.label}</h3>
                      <Badge variant="secondary" className="text-xs">{stageOpps.length}</Badge>
                    </div>
                    <div className="space-y-2 min-h-[100px]">
                      {stageOpps.map((opp: any, index: number) => {
                        const daysStale = differenceInDays(new Date(), new Date(opp.updated_at));
                        return (
                          <Draggable key={opp.id} draggableId={opp.id} index={index}>
                            {(provided) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab ${daysStale > 7 ? "border-destructive/50" : ""}`}
                              >
                                <CardContent className="p-3 space-y-1">
                                  <p className="font-medium text-sm truncate">{opp.clients?.name}</p>
                                  {opp.products?.name && <p className="text-xs text-muted-foreground truncate">{opp.products.name}</p>}
                                  {opp.estimated_amount && <p className="text-sm font-semibold">${Number(opp.estimated_amount).toLocaleString()}</p>}
                                  {daysStale > 7 && <Badge variant="destructive" className="text-xs">{daysStale}d sin movimiento</Badge>}
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Loss reason dialog */}
      <Dialog open={lossDialogOpen} onOpenChange={setLossDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Motivo de pérdida</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>¿Por qué se perdió esta oportunidad? *</Label>
            <Textarea value={lossReason} onChange={(e) => setLossReason(e.target.value)} placeholder="Precio, competencia, timing..." />
            <Button onClick={confirmLoss} className="w-full">Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
