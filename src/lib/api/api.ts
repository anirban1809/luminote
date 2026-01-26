import { getAccessToken, refreshAccessToken } from "./auth";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const host = "https://stagingapi.luminote.ai";

    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) throw new Error("Not authenticated");

    const headers = new Headers(options.headers);
    options.credentials = "include";
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${host}${path}`, {
        ...options,
        credentials: "include",
        headers,
    });
}

export async function sseFetch(path: string, options: RequestInit = {}) {
    const host = "https://ssestaging.luminote.ai";

    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) throw new Error("Not authenticated");

    const headers = new Headers(options.headers);
    options.credentials = "include";
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${host}${path}`, {
        ...options,
        credentials: "include",
        headers,
    });
}
