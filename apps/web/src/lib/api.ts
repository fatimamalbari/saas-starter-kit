const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface RequestOptions {
  method?: string;
  body?: unknown;
  tenantId?: string;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, tenantId } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const currentTenantId = tenantId || localStorage.getItem("tenantId");
  if (currentTenantId) {
    headers["x-tenant-id"] = currentTenantId;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json;
}
