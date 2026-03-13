import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import inboxRevLogo from "@/assets/inboxrev-logo.png";

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border relative z-10">
        <CardHeader className="text-center space-y-3 pb-2">
          <img src={inboxRevLogo} alt="InboxRev" className="mx-auto h-14 w-14 rounded-2xl glow-sm" />
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="mt-1">Sign in to your InboxRev account</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="h-11 bg-secondary/50 border-border focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-11 bg-secondary/50 border-border focus:border-primary" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full h-11 gradient-primary hover:opacity-90 transition-opacity font-semibold" disabled={submitting}>
              {submitting ? "Signing in..." : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
            <div className="flex justify-between w-full text-sm">
              <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">Forgot password?</Link>
              <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">Create account</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
