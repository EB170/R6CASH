import { useAuth } from "@/contexts/AuthProvider";

export const useSafeUser = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // ou un placeholder pendant le chargement
  }

  if (!user) {
    throw new Error("No authenticated user found");
  }

  return user;
};