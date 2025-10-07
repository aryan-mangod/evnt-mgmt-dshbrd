import { useAuth } from "./AuthProvider";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Shield } from "lucide-react";
import { loginRequest } from "../lib/msalConfig";

export function RootRedirect() {
  const { isAuthenticated, isAuthorized, isLoading, msalAuthenticated, phase, authError } = useAuth();
  const { instance, inProgress, accounts } = useMsal();
  const navigate = useNavigate();

  const handleLogin = () => {
    instance.loginRedirect({
      ...loginRequest,
      redirectUri: window.location.origin,
    }).catch(e => console.error('Login error:', e));
  };

  useEffect(() => {
    if (isAuthenticated && isAuthorized) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthorized, navigate]);

  // Detect if we are returning from an MSAL redirect (hash params) to avoid showing login prematurely
  const processingRedirect = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hash || '';
    return /(code=|id_token=|error=)/i.test(h) && inProgress !== 'none';
  }, [inProgress]);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin }).catch(e => console.error('Logout error:', e));
  };

  // If user is authenticated but not authorized, show access denied
  if (msalAuthenticated && !isAuthorized && !isLoading && authError && authError.toLowerCase().includes('not found')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 dark:text-red-400 text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Access Denied</h2>
            <p className="text-red-600 dark:text-red-400 text-center text-sm">
              Your account <strong>{accounts[0]?.username}</strong> is not in the authorized user list. Please contact an administrator.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
              <Button onClick={handleLogin}>Try Different Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading during authentication process
  if (processingRedirect || inProgress === "login" || phase === 'msal') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Signing you in...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'validating-backend') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Validating access...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form if not authenticated or still loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-1">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            CloudLabs Admin Portal
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Please sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isLoading || processingRedirect) ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-600 dark:text-slate-400">Loading...</span>
            </div>
          ) : (
            <Button 
              onClick={handleLogin} 
              className="w-full"
              disabled={inProgress !== "none"}
            >
              Sign in with SSO
            </Button>
          )}
          {authError && !msalAuthenticated && (
            <p className="text-xs text-red-500 text-center mt-2">{authError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}