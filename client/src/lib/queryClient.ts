import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Define base apiRequest function
const baseApiRequest = async function(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
};

// Define the apiRequest object with methods
export const apiRequest = baseApiRequest as {
  (method: string, url: string, data?: unknown): Promise<Response>;
  post: (url: string, data?: unknown, options?: { responseType?: string }) => Promise<any>;
  put: (url: string, data?: unknown, options?: { responseType?: string }) => Promise<any>;
};

// Add convenience methods for common HTTP verbs
apiRequest.post = async function(
  url: string, 
  data?: unknown, 
  options?: { responseType?: string }
): Promise<any> {
  // Create fetch options
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include"
  };
  
  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  
  // Handle different response types
  if (options?.responseType === 'blob') {
    return res;
  }
  
  // For regular JSON responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await res.json();
    return json;
  }
  
  return res;
}

// Add PUT method
apiRequest.put = async function(
  url: string, 
  data?: unknown, 
  options?: { responseType?: string }
): Promise<any> {
  // Create fetch options
  const fetchOptions: RequestInit = {
    method: 'PUT',
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include"
  };
  
  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  
  // Handle different response types
  if (options?.responseType === 'blob') {
    return res;
  }
  
  // For regular JSON responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await res.json();
    return json;
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0, // No stale time - always refetch when needed
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
