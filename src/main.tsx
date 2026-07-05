import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { handleSupabaseApiCall, initializeDatabase } from "./lib/supabase";

// Intercept all /api/ fetch calls and route them directly to Supabase / Local database client
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.startsWith("/api/")) {
        return handleSupabaseApiCall(url, init);
      }
      return originalFetch(input, init);
    },
    writable: true,
    configurable: true
  });
} catch (e) {
  console.warn("Failed to intercept window.fetch directly, using assignment fallback:", e);
  try {
    (window as any).fetch = async (input: any, init: any) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.startsWith("/api/")) {
        return handleSupabaseApiCall(url, init);
      }
      return originalFetch(input, init);
    };
  } catch (err) {
    console.error("Critical: Could not intercept fetch:", err);
  }
}

// Initialize database
initializeDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
