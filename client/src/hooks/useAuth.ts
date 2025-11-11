import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useAuth() {
  const [, navigate] = useLocation();
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // 401错误时返回null而不是抛出错误
    throwOnError: (err: any) => {
      return err?.status !== 401;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      // 清除所有查询缓存
      queryClient.clear();
      navigate("/login");
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
