// Type declarations for the apiRequest helper
import { apiRequest as baseApiRequest } from "@/lib/queryClient";

declare module "@/lib/queryClient" {
  interface ApiRequest {
    (method: string, url: string, data?: unknown): Promise<Response>;
    post: (url: string, data?: unknown, options?: { responseType?: string }) => Promise<any>;
    put: (url: string, data?: unknown, options?: { responseType?: string }) => Promise<any>;
  }

  export const apiRequest: ApiRequest;
}