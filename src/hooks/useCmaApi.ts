const BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://eu-api.contentstack.com";
const API_KEY = process.env.REACT_APP_API_KEY || "";
const MANAGEMENT_TOKEN = process.env.REACT_APP_MANAGEMENT_TOKEN || "";

export async function cmaFetch<T = any>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  let url = `${BASE_URL}/v3${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      api_key: API_KEY,
      authorization: MANAGEMENT_TOKEN,
    },
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
