import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DrivePage from "./pages/DrivePage";

const qc = new QueryClient();

// Must match Vite's base config.
// import.meta.env.BASE_URL is "/" locally and "/tgdrive/" on GitHub Pages.
// BrowserRouter.basename should NOT have a trailing slash.
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
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/drive" replace /> : <LoginPage />}
      />
      <Route
        path="/drive"
        element={<ProtectedRoute><DrivePage /></ProtectedRoute>}
      />
      <Route
        path="/drive/:folderId"
        element={<ProtectedRoute><DrivePage /></ProtectedRoute>}
      />
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}