import { useAuth } from "./AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "./ui/card";

export function RootRedirect() {
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && isAuthorized) {
        // User is fully authenticated and authorized, go to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // User needs to login or isn't authorized, go to login
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isAuthorized, isLoading, navigate]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            Loading...
          </span>
        </CardContent>
      </Card>
    </div>
  );
}