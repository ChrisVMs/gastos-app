"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

import { Brand } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const requestedNext = searchParams.get("next") ?? "/";
  const [error, setError] = useState(
    searchParams.get("error") === "auth"
      ? "No se pudo completar el inicio de sesión. Inténtalo de nuevo."
      : ""
  );

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        router.replace(requestedNext);
      } else {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [router, requestedNext]);

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signInError) {
      setError(
        "No se pudo iniciar sesión. Verifica la configuración de Google OAuth en Supabase."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Brand />
          <CardTitle className="mt-4 text-xl">Inicia sesión</CardTitle>
          <CardDescription>
            Usa tu cuenta de Google para acceder a Mis Finanzas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSignIn}
            disabled={loading}
          >
            <Globe className="h-4 w-4" />
            {loading ? "Redirigiendo…" : "Continuar con Google"}
          </Button>
          {error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-center text-center text-xs text-muted-foreground">
          Tu información se guarda de forma segura y es privada para tu cuenta.
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}