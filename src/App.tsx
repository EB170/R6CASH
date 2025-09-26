// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";

import { AuthProvider, useAuth } from "@/contexts/AuthProvider";
import Dashboard from "@/components/Dashboard";
import SignInPage from "@/components/SignInPage";
import SignUpPage from "@/components/SignUpPage"; // ⚡ tu dois créer ce composant

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero text-white">
        <p className="text-lg font-bold">Chargement de votre session...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Home redirige vers Dashboard si connecté */}
      <Route path="/" element={user ? <Dashboard onSignOut={() => {}} /> : <Navigate to="/signin" replace />} />

      {/* Auth pages */}
      <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignInPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUpPage />} />

      {/* Paiement */}
      <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
