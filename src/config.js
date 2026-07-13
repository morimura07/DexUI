// Single source of truth for the API base URL.
// The value comes from VITE_API_URL in the .env file (set at build time);
// the localhost fallback is only used for local development when it isn't set.
// Change the URL in .env — never hard-code it in individual files.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';