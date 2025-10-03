import { useMsal } from "@azure/msal-react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  userRole: string;
  isLoading: boolean;
  isAuthorized: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  userRole: 'user',
  isLoading: true,
  isAuthorized: false,
  authError: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accounts, inProgress } = useMsal();
  const [userRole, setUserRole] = useState<string>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [validatedUser, setValidatedUser] = useState<any>(null);

  const isAuthenticated = accounts.length > 0;
  const b2cUser = accounts[0] || null;

  // Function to validate B2C user against backend
  const validateUserInBackend = async (email: string) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log('Validating user with email:', email);
      
      // Use relative URL for production, full URL for development
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:4000/api/validate-b2c-user'
        : '/api/validate-b2c-user';
      
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      console.log('API Response:', { status: response.status, result });

      if (response.ok && result.success) {
        console.log('User validation successful:', result.user);
        // Store the token for API calls
        localStorage.setItem('authToken', result.token);
        
        setValidatedUser(result.user);
        setUserRole(result.user.role);
        setIsAuthorized(true);
        setAuthError(null);
      } else {
        console.log('User validation failed:', result.error);
        setIsAuthorized(false);
        setAuthError(result.error || 'User not authorized');
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error validating user:', error);
      setIsAuthorized(false);
      setAuthError('Error validating user credentials');
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('AuthProvider state:', { 
      inProgress, 
      isAuthenticated, 
      userEmail: b2cUser?.username,
      accountsCount: accounts.length 
    });
    
    if (inProgress === "none") {
      if (isAuthenticated && b2cUser?.username) {
        console.log('Validating B2C user:', b2cUser.username);
        // B2C user is authenticated, now validate against our backend
        validateUserInBackend(b2cUser.username);
      } else {
        console.log('No B2C authentication or in progress');
        // No B2C authentication
        setIsLoading(false);
        setIsAuthorized(false);
        setValidatedUser(null);
        setUserRole('user');
        localStorage.removeItem('authToken');
      }
    }
  }, [isAuthenticated, b2cUser?.username, inProgress]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated: isAuthenticated && isAuthorized,
      user: validatedUser || b2cUser,
      userRole,
      isLoading: isLoading || inProgress !== "none",
      isAuthorized,
      authError,
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