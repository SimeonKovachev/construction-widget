const TOKEN_KEY = "superadmin_token";

export const getToken   = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken   = (token: string)   => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = ()                => localStorage.removeItem(TOKEN_KEY);
export const isLoggedIn = (): boolean       => !!getToken();
