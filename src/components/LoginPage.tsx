import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Shield, User } from "lucide-react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, msalConfig } from "../lib/msalConfig";
import { useAuth } from "./AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const { instance, accounts, inProgress } = useMsal();
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const navigate = useNavigate();

  // Check if this is a B2C callback that ended up on login page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthCallback = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
    
    if (hasAuthCallback) {
      console.log('Login page detected B2C callback parameters - redirecting to root for processing');
      navigate('/', { replace: true });
      return;
    }
  }, [navigate]);

  // Only redirect if user is fully processed and authorized
  useEffect(() => {
    // Don't redirect if we're still loading or processing authentication
    if (isLoading || inProgress !== "none") {
      return;
    }
    
    if (isAuthenticated && isAuthorized) {
      console.log('User fully authenticated and authorized, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAuthorized, isLoading, inProgress, navigate]);

  const handleLogin = () => {
    // Use MSAL's loginRedirect which handles PKCE automatically
    instance.loginRedirect({
      ...loginRequest,
      redirectUri: window.location.origin,
    }).catch(e => {
      console.error('Login error:', e);
    });
  };

  // Show loading state during authentication
  if (inProgress === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Authenticating...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            MS Innovation Event Management Dashboard
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Please sign in to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLogin} className="w-full" size="lg">
            <User className="w-4 h-4 mr-2" />
            Login or Sign Up
          </Button>
          <div className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
            <p>Secure authentication powered by Microsoft Azure</p>
            <details className="mt-2">
              <summary className="cursor-pointer">Debug Info</summary>
              <div className="text-left text-xs mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                <p>Accounts: {accounts.length}</p>
                <p>In Progress: {inProgress}</p>
                <p>Current URL: {window.location.href}</p>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}