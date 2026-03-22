/**
 * Client-side auth cookie helper.
 *
 * WeChat WKWebView doesn't reliably sync Set-Cookie headers from fetch() responses
 * to its navigation cookie store. This module sets the auth cookie via document.cookie
 * which is immediately available for the next window.location navigation.
 *
 * NOTE: This cookie is NOT HttpOnly (client-side set cookies can't be).
 * The server also sets an HttpOnly version via Set-Cookie header as a backup.
 * The middleware accepts either — whichever arrives first wins.
 */

const COOKIE_NAME = "auth-token";
const LOGGED_IN_COOKIE = "logged-in";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Set the auth cookie client-side for immediate availability.
 * Call this after a successful login/register API response before navigating.
 */
export function setClientAuthCookie(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
  document.cookie = `${LOGGED_IN_COOKIE}=1; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Clear the auth cookie client-side.
 * Call this on logout to ensure cleanup in all browser contexts.
 */
export function clearClientAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${LOGGED_IN_COOKIE}=; path=/; max-age=0`;
}
