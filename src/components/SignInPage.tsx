import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      toast({
        title: "Connexion réussie 🎉",
        description: "Bienvenue sur R6Cash",
      });
    } catch (err: any) {
      toast({
        title: "Erreur de connexion",
        description: err.message || "Impossible de se connecter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero text-white">
      <Card className="w-[95%] max-w-md bg-card/80 border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">Connexion à R6Cash</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <Input
                type="password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 border-border mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold shadow-primary hover:glow-primary"
            >
              {loading ? "Connexion..." : <><LogIn className="h-4 w-4 mr-2" /> Se connecter</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}