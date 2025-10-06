import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Card, CardContent } from "./ui/card";

export function RootRedirect() {
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const { inProgress } = useMsal();
  const navigate = useNavigate();
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);

  useEffect(() => {
    // Check if we're processing a B2C redirect
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthCode = urlParams.has('code') || urlParams.has('state');
    
    if (hasAuthCode && !hasProcessedRedirect) {
      console.log('Processing B2C redirect callback...');
      setHasProcessedRedirect(true);
      return; // Let MSAL handle the redirect
    }

    if (!isLoading && inProgress === "none") {
      if (isAuthenticated && isAuthorized) {
        // User is fully authenticated and authorized, go to dashboard
        console.log('User authenticated and authorized, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else if (!isAuthenticated) {
        // User needs to login
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
      }
      // If authenticated but not authorized, stay here to show error
    }
  }, [isAuthenticated, isAuthorized, isLoading, inProgress, navigate, hasProcessedRedirect]);

  // If user is authenticated but not authorized, show access denied
  if (isAuthenticated && !isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 dark:text-red-400 text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Access Denied</h2>
            <p className="text-red-600 dark:text-red-400 text-center text-sm">
              You are not authorized to access this portal. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            {hasProcessedRedirect ? 'Processing authentication...' : 'Loading...'}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}