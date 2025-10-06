import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "./components/AuthProvider";
import { LoginPage } from "./components/LoginPage";
import { DashboardPage } from "./components/DashboardPage";
import { RootRedirect } from "./components/RootRedirect";
import Index from "./pages/Index";
import UsersPage from "./pages/Users";
import CatalogHealth from "./pages/CatalogHealth";
import Top25Tracks from "./pages/Top25Tracks";
import RoadmapPage from "./pages/RoadmapPage";
import LocalizedTracksPage from "./pages/LocalizedTracksPage";
import ParticipantFeedbackPage from "./pages/ParticipantFeedbackPage";
import AuthTest from "./pages/AuthTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected routes are now handled by DashboardPage component
const ProtectedRoute = () => {
  return <DashboardPage />;
};

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // log to console for now
    console.error('Uncaught render error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <pre className="mt-4 whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="dashboard-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Root redirect - simple redirect logic */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Login page - separate from dashboard */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected dashboard routes */}
                <Route path="/dashboard" element={<ProtectedRoute />}>
                  <Route index element={<Index />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="catalog-health" element={<CatalogHealth />} />
                  <Route path="top25-tracks" element={<Top25Tracks />} />
                  <Route path="roadmap" element={<RoadmapPage />} />
                  <Route path="localized-tracks" element={<LocalizedTracksPage />} />
                  <Route path="participant-feedback" element={<ParticipantFeedbackPage />} />
                  <Route path="auth-test" element={<AuthTest />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
