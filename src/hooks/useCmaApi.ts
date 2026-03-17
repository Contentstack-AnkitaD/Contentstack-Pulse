const BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || "https://eu-api.contentstack.com";
const API_KEY = import.meta.env.REACT_APP_API_KEY || "";
const MANAGEMENT_TOKEN = import.meta.env.REACT_APP_MANAGEMENT_TOKEN || "";
const AUTH_TOKEN = import.meta.env.REACT_APP_AUTHTOKEN || "";

export async function cmaFetch<T = any>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  let url = `${BASE_URL}/v3${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Prefer authtoken (full access), fall back to management token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    api_key: API_KEY,
  };

  if (AUTH_TOKEN) {
    headers.authtoken = AUTH_TOKEN;
  } else {
    headers.authorization = MANAGEMENT_TOKEN;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = `CMA API error: ${response.status}`;
    try {
      const errData = JSON.parse(errText);
      msg = errData.error_message || errData.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}
