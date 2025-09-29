import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isGuest, isLoading } = useAuth();

  // Important: We're using a function component here to ensure correct typing
  return (
    <Route path={path}>
      {() => {
        // Debug logging for authentication state
        console.log(`🛡️ ProtectedRoute ${path} - Auth State:`, { 
          hasUser: !!user, 
          isGuest, 
          isLoading,
          username: user?.username || 'no-user',
          shouldAllow: !!(user || isGuest),
          willRedirect: !user && !isGuest && !isLoading
        });

        if (isLoading) {
          console.log(`🛡️ ProtectedRoute ${path} - Showing loading...`);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user && !isGuest) {
          console.log(`🛡️ ProtectedRoute ${path} - Redirecting to auth (no user, no guest)`);
          return <Redirect to="/auth" />;
        }

        console.log(`🛡️ ProtectedRoute ${path} - Allowing access`);
        return <Component />;
      }}
    </Route>
  );
}