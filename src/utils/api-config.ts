export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    equipment: string;
    equipmentById: (id: string) => string;
  };
}

let apiConfig: ApiConfig = {
  baseUrl: 'http://localhost:8080/api', // default
  endpoints: {
    equipment: '/equipment',
    equipmentById: (id: string) => `/equipment/${id}`,
  }
};

export function setApiBaseUrl(baseUrl: string) {
  apiConfig.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function getApiConfig(): ApiConfig {
  return apiConfig;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${apiConfig.baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error || parsed.message || errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
