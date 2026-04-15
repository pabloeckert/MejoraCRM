import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, User, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type OpportunityStage = Database["public"]["Enums"]["opportunity_stage"];

const STAGES: { key: OpportunityStage; label: string; color: string; headerColor: string }[] = [
  { key: "prospecto", label: "Prospecto", color: "bg-muted/40", headerColor: "bg-muted-foreground/10 text-muted-foreground" },
  { key: "contactado", label: "Contactado", color: "bg-primary/5", headerColor: "bg-primary/10 text-primary" },
  { key: "cotizacion", label: "Cotización", color: "bg-accent/10", headerColor: "bg-accent/20 text-accent-foreground" },
  { key: "negociacion", label: "Negociación", color: "bg-warning/5", headerColor: "bg-warning/15 text-accent-foreground" },
  { key: "cerrado_ganado", label: "Ganado ✓", color: "bg-success/5", headerColor: "bg-success/10 text-success" },
  { key: "cerrado_perdido", label: "Perdido ✗", color: "bg-destructive/5", headerColor: "bg-destructive/10 text-destructive" },
];

export default function Pipeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const totalPipeline = opportunities
    .filter((o: any) => !o.stage.startsWith("cerrado"))
    .reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {opportunities.length} oportunidades • Pipeline: <span className="font-semibold text-foreground">${totalPipeline.toLocaleString()}</span>
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({})} className="h-9">
              <Plus className="h-4 w-4 mr-1" />Nueva oportunidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva oportunidad</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
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
              <div><Label>Monto estimado ($)</Label><Input type="number" value={form.estimated_amount || ""} onChange={(e) => setForm({ ...form, estimated_amount: e.target.value })} placeholder="0" /></div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>Crear oportunidad</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
          {STAGES.map((stage) => {
            const stageOpps = opportunities.filter((o: any) => o.stage === stage.key);
            const stageTotal = stageOpps.reduce((s: number, o: any) => s + (o.estimated_amount || 0), 0);
            return (
              <Droppable key={stage.key} droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[240px] w-[240px] rounded-xl p-3 shrink-0 transition-colors duration-200 ${
                      snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary/20" : stage.color
                    }`}
                  >
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${stage.headerColor}`}>{stage.label}</span>
                        <Badge variant="secondary" className="text-xs h-5">{stageOpps.length}</Badge>
                      </div>
                      {stageTotal > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5 pl-0.5">${stageTotal.toLocaleString()}</p>
                      )}
                    </div>
                    <div className="space-y-2 min-h-[80px]">
                      {stageOpps.map((opp: any, index: number) => {
                        const daysStale = differenceInDays(new Date(), new Date(opp.updated_at));
                        return (
                          <Draggable key={opp.id} draggableId={opp.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab border-border/50 transition-all duration-150 ${
                                  snapshot.isDragging ? "shadow-lg rotate-1 scale-105" : "hover:shadow-sm"
                                } ${daysStale > 7 && !opp.stage.startsWith("cerrado") ? "border-l-2 border-l-destructive" : ""}`}
                              >
                                <CardContent className="p-3 space-y-1.5">
                                  <div className="flex items-start justify-between">
                                    <p
                                      className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                                      onClick={() => navigate("/clients")}
                                    >
                                      {opp.clients?.name}
                                    </p>
                                  </div>
                                  {opp.products?.name && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Package className="h-3 w-3" />{opp.products.name}
                                    </div>
                                  )}
                                  {opp.estimated_amount && (
                                    <div className="flex items-center gap-1 text-sm font-semibold">
                                      <DollarSign className="h-3.5 w-3.5 text-success" />
                                      ${Number(opp.estimated_amount).toLocaleString()}
                                    </div>
                                  )}
                                  {daysStale > 7 && !opp.stage.startsWith("cerrado") && (
                                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 mt-1">
                                      <AlertTriangle className="h-3 w-3 mr-1" />{daysStale}d estancada
                                    </Badge>
                                  )}
                                  {opp.loss_reason && (
                                    <p className="text-xs text-destructive italic">"{opp.loss_reason}"</p>
                                  )}
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
