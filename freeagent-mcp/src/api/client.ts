import { getValidAccessToken } from "../auth/oauth.js";
import { getConfig, getBaseUrl } from "../auth/token-store.js";

const USER_AGENT = "MorrisonConsulting-FreeAgentMCP/1.0";

export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  currentPage: number;
}

export async function freeagentRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;
  const config = getConfig();
  const baseUrl = getBaseUrl(config.sandbox);
  const accessToken = await getValidAccessToken();

  const url = new URL(`${baseUrl}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `FreeAgent API error ${response.status} ${method} ${path}: ${errorText}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function freeagentPaginatedRequest<T>(
  path: string,
  resourceKey: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;

  while (true) {
    const response = await freeagentRequest<Record<string, unknown>>(path, {
      params: { ...params, page: String(page), per_page: "100" },
    });

    const items = response[resourceKey] as T[] | undefined;
    if (!items || items.length === 0) break;

    allItems.push(...items);

    // Check if there are more pages
    if (items.length < 100) break;
    page++;
  }

  return allItems;
}
