import { useMsal } from "@azure/msal-react";
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Shield, User } from "lucide-react";
import { loginRequest, msalConfig } from "../lib/msalConfig";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { instance, accounts, inProgress } = useMsal();

  const handleLogin = () => {
    // Use the exact redirect URI from MSAL config to avoid encoding issues
    const redirectUri = msalConfig.auth.redirectUri || window.location.origin;
    const directLoginUrl = `https://cloudlabsai.b2clogin.com/cloudlabsai.onmicrosoft.com/B2C_1A_CUSTOM_SIGNUP_SIGNIN/oauth2/v2.0/authorize?client_id=${msalConfig.auth.clientId}&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${btoa('azureb2c')}`;
    
    console.log('Redirect URI being used:', redirectUri);
    console.log('Full login URL:', directLoginUrl);
    
    window.location.href = directLoginUrl;
  };

  // Show loading state during authentication
  if (inProgress === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Authenticating...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login page if not authenticated
  if (accounts.length === 0) {
    if (fallback) {
      return <>{fallback}</>;
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
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Secure authentication powered by Microsoft Azure
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}