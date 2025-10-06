import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../lib/msalConfig";

export function RootRedirect() {
  const location = useLocation();
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const { instance, inProgress } = useMsal();

  // Check if this is a B2C callback
  const searchParams = new URLSearchParams(location.search);
  const hasCode = searchParams.has('code');
  const hasState = searchParams.has('state');
  const hasError = searchParams.has('error');
  const isB2CCallback = hasCode || hasState || hasError;

  console.log('RootRedirect - No Auto Redirect:', {
    pathname: location.pathname,
    search: location.search,
    isB2CCallback,
    isAuthenticated,
    isAuthorized,
    isLoading,
    inProgress
  });

  // Handle login button click
  const handleLogin = () => {
    instance.loginRedirect({
      ...loginRequest,
      redirectUri: window.location.origin,
    }).catch(e => {
      console.error('Login error:', e);
    });
  };

  // If this is a B2C callback, show processing message
  if (isB2CCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Processing authentication...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated and authorized, redirect to dashboard
  if (isAuthenticated && isAuthorized && !isLoading) {
    // Use window.location instead of navigate to avoid React Router issues
    window.location.href = '/dashboard';
    return null;
  }

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

  // Show login form if not authenticated or still loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-8">
          {isLoading || inProgress !== "none" ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <span className="text-slate-600 dark:text-slate-400">Loading...</span>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                CloudLabs Admin Portal
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                Please sign in to access the admin dashboard
              </p>
              <Button 
                onClick={handleLogin} 
                className="w-full"
                disabled={inProgress !== "none"}
              >
                Sign in with SSO
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Show loading while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            {location.search ? 'Processing authentication...' : 'Redirecting...'}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}