import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DrivePage from "./pages/DrivePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import AboutPage from "./pages/AboutPage";
import CookieBanner from "./components/CookieBanner";

const qc = new QueryClient();

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/drive" replace /> : <LoginPage />} />
      <Route path="/drive" element={<ProtectedRoute><DrivePage /></ProtectedRoute>} />
      <Route path="/drive/:folderId" element={<ProtectedRoute><DrivePage /></ProtectedRoute>} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/drive" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter basename={basename}>
        <AuthProvider>
          <AppRoutes />
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}