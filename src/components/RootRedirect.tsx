import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "./ui/card";
import { useAuthRedirect } from "../hooks/use-auth-redirect";

export function RootRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAuthorized } = useAuthRedirect();

  useEffect(() => {
    // Check if this is a B2C callback by looking for auth parameters
    const searchParams = new URLSearchParams(location.search);
    const hasCode = searchParams.has('code');
    const hasState = searchParams.has('state');
    const hasError = searchParams.has('error');
    const isB2CCallback = hasCode || hasState || hasError;
    
    console.log('RootRedirect - Enhanced Logic:', {
      pathname: location.pathname,
      search: location.search,
      hasCode,
      hasState,
      hasError,
      isB2CCallback,
      isAuthenticated,
      isAuthorized
    });

    if (isB2CCallback) {
      // This is a B2C callback - let the app handle it by staying on root
      console.log('🔄 B2C callback detected - waiting for auth processing');
      // The useAuthRedirect hook will handle navigation after auth completes
      return;
    }

    // No callback parameters - redirect to login after a short delay
    if (!isAuthenticated) {
      console.log('❌ No callback and not authenticated - redirecting to login');
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500); // Longer delay to prevent loops

      return () => clearTimeout(timer);
    }
    
  }, [location, navigate, isAuthenticated]);

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