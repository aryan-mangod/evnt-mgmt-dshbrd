import { useMsal } from "@azure/msal-react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  /** True only when BOTH MSAL sign-in happened and backend authorization succeeded */
  isAuthenticated: boolean;
  /** Raw MSAL account object or validated backend user */
  user: any;
  /** Role coming from backend validation */
  userRole: string;
  /** Overall loading (MSAL in progress OR backend validation happening) */
  isLoading: boolean;
  /** Backend authorization success (user found + role accepted) */
  isAuthorized: boolean;
  /** Error string if backend validation failed or backend unreachable */
  authError: string | null;
  /** Indicates MSAL has an authenticated account (before backend check) */
  msalAuthenticated: boolean;
  /** Fine grained phase to help UI: idle | msal | validating-backend | ready */
  phase: string;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  userRole: 'user',
  isLoading: true,
  isAuthorized: false,
  authError: null,
  msalAuthenticated: false,
  phase: 'idle'
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accounts, inProgress } = useMsal();
  const [userRole, setUserRole] = useState<string>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [validatedUser, setValidatedUser] = useState<any>(null);
  const [phase, setPhase] = useState<'idle' | 'msal' | 'validating-backend' | 'ready'>('idle');

  // MSAL layer auth (raw) – separate from backend authorization
  const msalAuthenticated = accounts.length > 0;
  const b2cUser = accounts[0] || null;
  // Prefer explicit email claims over username (B2C sometimes sets username to a technical identifier)
  const primaryEmail: string | undefined = (b2cUser as any)?.idTokenClaims?.emails?.[0]
    || (b2cUser as any)?.idTokenClaims?.email
    || b2cUser?.username;

  // Function to validate B2C user against backend
  const validateUserInBackend = async (email: string) => {
    let timeoutId: number | undefined;
    try {
      setPhase('validating-backend');
      setIsLoading(true);
      setAuthError(null);
      console.log('Validating user with email:', email);
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4000/api/validate-b2c-user'
        : '/api/validate-b2c-user';
      console.log('API URL:', apiUrl);

      // Implement a timeout (15s) to prevent infinite spinner if network hangs
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let result: any = {};
      try { result = await response.json(); } catch { /* ignore JSON parse errors */ }
      console.log('API Response:', { status: response.status, result });

      if (response.ok && result.success) {
        localStorage.setItem('authToken', result.token);
        const cacheEntry = { email, role: result.user.role, token: result.token, user: result.user, expiresAt: Date.now() + 10 * 60 * 1000 };
        localStorage.setItem('authCache', JSON.stringify(cacheEntry));
        setValidatedUser(result.user);
        setUserRole(result.user.role);
        setIsAuthorized(true);
        setAuthError(null);
        console.log('✅ User authorized successfully');
      } else {
        // Distinguish 403 (user not found) from other errors
        if (response.status === 403) {
          setAuthError(result.error || 'User not found in authorized list');
        } else if (response.status === 400) {
          setAuthError(result.error || 'Invalid request');
        } else if (response.status === 500) {
          setAuthError(result.error || 'Server error during validation');
        } else {
          setAuthError(result.error || 'User not authorized');
        }
        setIsAuthorized(false);
        localStorage.removeItem('authToken');
        console.log('❌ User authorization failed');
      }
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('Error validating user:', error);
      if (error && error.name === 'AbortError') {
        setAuthError('Validation timeout. Please retry or contact administrator.');
      } else if (error instanceof TypeError && String(error.message).includes('fetch')) {
        setAuthError('Backend server not available. Please contact administrator.');
      } else {
        setAuthError('Error validating user credentials');
      }
      setIsAuthorized(false);
      localStorage.removeItem('authToken');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
      setPhase('ready');
    }
  };

  useEffect(() => {
    console.log('AuthProvider state:', { 
      inProgress, 
      msalAuthenticated, 
      rawUsername: b2cUser?.username,
      claimedEmail: (b2cUser as any)?.idTokenClaims?.email,
      claimedEmailsArr: (b2cUser as any)?.idTokenClaims?.emails,
      resolvedPrimaryEmail: primaryEmail,
      accountsCount: accounts.length,
      phase
    });

    if (inProgress !== 'none') {
      setPhase('msal');
      return; // still processing MSAL
    }

    // MSAL finished
    if (msalAuthenticated && primaryEmail) {
      // Only revalidate if we don't already have a validatedUser for same email
      const cacheRaw = localStorage.getItem('authCache');
      let usedCache = false;
      if (cacheRaw) {
        try {
          const parsed = JSON.parse(cacheRaw);
          if (parsed.email === primaryEmail && parsed.expiresAt > Date.now()) {
            console.log('Using cached authorization for user:', parsed.email);
            setValidatedUser(parsed.user);
            setUserRole(parsed.role);
            setIsAuthorized(true);
            localStorage.setItem('authToken', parsed.token);
            setPhase('ready');
            setIsLoading(false);
            usedCache = true;
          } else if (parsed.email === primaryEmail && parsed.expiresAt <= Date.now()) {
            console.log('Cached authorization expired, revalidating...');
          }
        } catch (_) {
          // Ignore parse errors
        }
      }
      if (!usedCache && (!validatedUser || validatedUser.email !== primaryEmail)) {
        console.log('Validating B2C user (no valid cache):', primaryEmail);
        validateUserInBackend(primaryEmail);
      }
    } else {
      // No MSAL account present
      if (phase !== 'idle') setPhase('idle');
      setIsLoading(false);
      setIsAuthorized(false);
      setValidatedUser(null);
      setUserRole('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authCache');
    }
  }, [msalAuthenticated, primaryEmail, inProgress, validatedUser, phase]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: msalAuthenticated && isAuthorized,
      user: validatedUser || b2cUser,
      userRole,
      isLoading: isLoading || inProgress !== "none",
      isAuthorized,
      authError,
      msalAuthenticated,
      phase,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};