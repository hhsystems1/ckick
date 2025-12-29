import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function SignIn() {
  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to CodeStudio</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to get started with your projects
          </p>
        </div>
        <Button
          onClick={handleSignIn}
          className="w-full"
          variant="default"
          size="lg"
        >
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
}
