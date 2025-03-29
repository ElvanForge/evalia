// API helper functions

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// PUT helper
export async function putRequest(
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