import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // 401 means signed out, which is a state rather than an error.
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/auth/logout");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to logout" }));
          throw new Error(errorData.error || "Failed to logout");
        }
        return res.json();
      } catch (error: any) {
        console.error("Logout API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      localStorage.removeItem("token");

      queryClient.clear();

      try {
        sessionStorage.clear();
        localStorage.removeItem("user");
      } catch (e) {
        // Ignore storage errors
      }

      toast({
        title: "Logged out successfully",
        description: "You have been logged out. See you soon!",
      });

      setTimeout(() => {
        navigate("/login");
      }, 100);
    },
    onError: (error: any) => {
      // Clear local state even if the call failed — the user asked to sign out.
      localStorage.removeItem("token");
      queryClient.clear();
      try {
        sessionStorage.clear();
        localStorage.removeItem("user");
      } catch (e) {
        // Ignore storage errors
      }

      toast({
        title: "Logged out",
        description: error.message || "You have been logged out locally.",
        variant: "default",
      });

      setTimeout(() => {
        navigate("/login");
      }, 100);
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
