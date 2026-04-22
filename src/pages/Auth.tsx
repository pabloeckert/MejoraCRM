import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("vendedor");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Cuenta creada. Revisa tu email para confirmar.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <img src={logoImg} alt="Mejora Continua" className="h-16 object-contain mb-3" />
          <p
            className="text-xs font-bold tracking-[0.3em] text-primary uppercase"
            style={{ fontFamily: "'League Spartan', sans-serif" }}
          >
            CRM
          </p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-primary/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Ingresá tus credenciales" : "Completá tus datos para registrarte"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Juan Pérez" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="juan@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••" />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? "Cargando..." : isLogin ? "Iniciar sesión" : "Registrarse"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
                <span className="font-medium text-primary underline underline-offset-4">
                  {isLogin ? "Registrate" : "Iniciá sesión"}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
