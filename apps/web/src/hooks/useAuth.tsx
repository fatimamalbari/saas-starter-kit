import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
}

interface TenantWithRole {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  tenants: TenantWithRole[];
  currentTenantId: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    name: string,
    password: string,
    tenantName: string
  ) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenants: [],
    currentTenantId: localStorage.getItem("tenantId"),
    loading: true,
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await api<{
        success: boolean;
        data: { user: User; tenants: TenantWithRole[] };
      }>("/auth/me");
      const savedTenantId = localStorage.getItem("tenantId");
      const tenantId =
        res.data.tenants.find((t) => t.id === savedTenantId)?.id ||
        res.data.tenants[0]?.id ||
        null;

      if (tenantId) localStorage.setItem("tenantId", tenantId);

      setState({
        user: res.data.user,
        tenants: res.data.tenants,
        currentTenantId: tenantId,
        loading: false,
      });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("tenantId");
      setState({ user: null, tenants: [], currentTenantId: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchMe();
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await api<{
      success: boolean;
      data: { token: string; user: User; tenants: TenantWithRole[] };
    }>("/auth/login", { method: "POST", body: { email, password } });

    localStorage.setItem("token", res.data.token);
    const tenantId = res.data.tenants[0]?.id || null;
    if (tenantId) localStorage.setItem("tenantId", tenantId);

    setState({
      user: res.data.user,
      tenants: res.data.tenants,
      currentTenantId: tenantId,
      loading: false,
    });
  };

  const signup = async (
    email: string,
    name: string,
    password: string,
    tenantName: string
  ) => {
    const res = await api<{
      success: boolean;
      data: {
        token: string;
        user: User;
        tenant: { id: string; name: string; slug: string };
      };
    }>("/auth/signup", {
      method: "POST",
      body: { email, name, password, tenantName },
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("tenantId", res.data.tenant.id);

    setState({
      user: res.data.user,
      tenants: [{ ...res.data.tenant, role: "OWNER" }],
      currentTenantId: res.data.tenant.id,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    setState({ user: null, tenants: [], currentTenantId: null, loading: false });
  };

  const switchTenant = (tenantId: string) => {
    localStorage.setItem("tenantId", tenantId);
    setState((s) => ({ ...s, currentTenantId: tenantId }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, switchTenant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
