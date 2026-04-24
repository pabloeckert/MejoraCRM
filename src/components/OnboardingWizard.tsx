import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, BarChart3, ChevronRight, ChevronLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    icon: Users,
    title: "Cargá tu primer cliente",
    description: "Empezá agregando los datos de contacto de un cliente o prospecto. Podés importar varios a la vez con CSV.",
    cta: "Ir a Clientes",
    route: "/clients",
    tip: "Completá el WhatsApp — es el canal más usado en Argentina.",
  },
  {
    icon: MessageSquare,
    title: "Registrá una interacción",
    description: "Cada contacto con un cliente es una interacción: llamadas, mensajes, reuniones, presupuestos.",
    cta: "Ir a Interacciones",
    route: "/interactions",
    tip: "Registrá siempre el resultado y el próximo paso.",
  },
  {
    icon: BarChart3,
    title: "Revisá tu Dashboard",
    description: "El Dashboard muestra tus ventas, pipeline y seguimientos pendientes de un vistazo.",
    cta: "Ir al Dashboard",
    route: "/",
    tip: "Los vendedores ven solo sus métricas. Los dueños ven todo el equipo.",
  },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding_dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setVisible(false);
  };

  const handleNavigate = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setVisible(false);
    navigate(current.route);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardContent className="p-8 text-center space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>

          {/* Tip */}
          <div className="bg-accent/10 rounded-lg p-3 text-xs text-accent-foreground">
            💡 {current.tip}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={step === 0}
              className="h-9"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button size="sm" onClick={handleNavigate} className="h-9">
              {current.cta}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {step < STEPS.length - 1 ? "Saltar onboarding" : "Cerrar"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
