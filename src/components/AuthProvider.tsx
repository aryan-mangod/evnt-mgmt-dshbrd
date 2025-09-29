import { useMsal } from "@azure/msal-react";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  userRole: string;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  userRole: 'user',
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accounts, inProgress } = useMsal();
  const [userRole, setUserRole] = useState<string>('user');
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = accounts.length > 0;
  const user = accounts[0] || null;

  useEffect(() => {
    if (inProgress === "none") {
      // Determine user role based on email or other claims
      if (user?.username) {
        // For now, set admin role for specific users
        // In production, this would come from the token claims
        const adminUsers = ['admin@events.com', 'aryan.p@spektrasystems.com'];
        if (adminUsers.includes(user.username.toLowerCase())) {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      }
      setIsLoading(false);
    }
  }, [user, inProgress]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      userRole,
      isLoading: isLoading || inProgress !== "none",
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