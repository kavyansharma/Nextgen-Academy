export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

interface CustomWindow extends Window {
  gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
}

// Log page views
export function pageview(url: string) {
  const win = typeof window !== "undefined" ? (window as CustomWindow) : null;
  if (!win || !GA_TRACKING_ID || !win.gtag) return;
  win.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
}

interface EventPayload {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Log custom tracking events
export function trackEvent({ action, category, label, value }: EventPayload) {
  const win = typeof window !== "undefined" ? (window as CustomWindow) : null;
  if (!win || !GA_TRACKING_ID || !win.gtag) return;
  win.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}
