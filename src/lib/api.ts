// Frontend API client for AskMyNotes backend

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

const getToken = () => localStorage.getItem("auth_token");

export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { method = "GET", headers = {}, body } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "bypass-tunnel-reminder": "true",
    ...headers,
  };

  // Add auth token if available
  const token = getToken();
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  let requestBody;
  if (body instanceof FormData) {
    delete defaultHeaders["Content-Type"];
    requestBody = body;
  } else if (body) {
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: defaultHeaders,
    body: requestBody,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: (firebaseId: string, email: string, displayName?: string, photoUrl?: string) =>
    apiCall("/auth/register", {
      method: "POST",
      body: { firebaseId, email, displayName, photoUrl },
    }),

  validate: (userId: string) =>
    apiCall("/auth/validate", {
      method: "POST",
      body: { userId },
    }),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => apiCall("/subjects"),

  create: (name: string, description?: string) =>
    apiCall("/subjects", {
      method: "POST",
      body: { name, description },
    }),

  update: (id: string, name?: string, description?: string) =>
    apiCall(`/subjects/${id}`, {
      method: "PUT",
      body: { name, description },
    }),

  delete: (id: string) =>
    apiCall(`/subjects/${id}`, { method: "DELETE" }),
};

// PDFs API
export const pdfsAPI = {
  upload: (file: File, subjectId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", subjectId);

    return apiCall("/pdfs/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },

  getBySubject: (subjectId: string) =>
    apiCall(`/pdfs?subjectId=${subjectId}`),

  delete: (id: string) =>
    apiCall(`/pdfs/${id}`, { method: "DELETE" }),
};

// Chats API
export const chatsAPI = {
  getBySubject: (subjectId: string) =>
    apiCall(`/chats?subjectId=${subjectId}`),

  create: (subjectId: string, title?: string) =>
    apiCall("/chats", {
      method: "POST",
      body: { subjectId, title },
    }),

  getMessages: (chatId: string) =>
    apiCall(`/chats/${chatId}/messages`),

  ask: (chatId: string, question: string, level: string = "medium") =>
    apiCall(`/chats/${chatId}/ask`, {
      method: "POST",
      body: { question, level },
    }),

  delete: (chatId: string) =>
    apiCall(`/chats/${chatId}`, { method: "DELETE" }),

  generateMCQ: (subjectId: string, count: number = 5, level: string = "medium") =>
    apiCall(`/chats/mcq/${subjectId}?count=${count}&level=${level}`),

  transcribe: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    return apiCall("/chats/transcribe", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
};

// Payments API
export const paymentsAPI = {
  createCheckoutSession: (priceId: string) =>
    apiCall("/payment/create-checkout-session", {
      method: "POST",
      body: { priceId },
    }),

  getStatus: () => apiCall("/payment/status"),
};

// Helper to save token
export const saveToken = (token: string) => {
  localStorage.setItem("auth_token", token);
};

// Helper to get token
export const getAuthToken = () => localStorage.getItem("auth_token");

// Helper to clear token
export const clearToken = () => {
  localStorage.removeItem("auth_token");
};
