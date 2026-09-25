export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export type HostedZone = {
  id: number;
  name: string;
  type: string;
  comment: string;
  private_zone: boolean;
  created_at: string;
  record_count: number;
};

export type DNSRecord = {
  id: number;
  hosted_zone_id: number;
  name: string;
  type: string;
  ttl: number;
  value: string;
  routing_policy: string;
  created_at: string;
};

export type PageResult<T> = { items:T[]; page:number; page_size:number; total:number; pages:number };

export const api = {
  login: (email: string, password: string) =>
    request<{ email: string; name: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request<{ email: string; name: string }>("/auth/me"),

  zones: (search = "", page = 1) =>
    request<PageResult<HostedZone>>(`/hosted-zones?search=${encodeURIComponent(search)}&page=${page}&page_size=8`),

  createZone: (data: Partial<HostedZone>) =>
    request<HostedZone>("/hosted-zones", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateZone: (id: number, data: Partial<HostedZone>) =>
    request<HostedZone>(`/hosted-zones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  deleteZone: (id: number) =>
    request(`/hosted-zones/${id}`, { method: "DELETE" }),

  records: (zoneId: number, search = "", type = "", page = 1) =>
    request<PageResult<DNSRecord>>(
      `/hosted-zones/${zoneId}/records?search=${encodeURIComponent(search)}&record_type=${encodeURIComponent(type)}&page=${page}&page_size=10`
    ),

  createRecord: (zoneId: number, data: Partial<DNSRecord>) =>
    request<DNSRecord>(`/hosted-zones/${zoneId}/records`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateRecord: (id: number, data: Partial<DNSRecord>) =>
    request<DNSRecord>(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  deleteRecord: (id: number) =>
    request(`/records/${id}`, { method: "DELETE" }),

  exportZone: (id:number) => request(`/export/hosted-zones/${id}`)
};
