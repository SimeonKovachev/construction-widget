import { createRoot } from "react-dom/client";
import Widget from "./Widget";

declare global {
  interface Window {
    SalesWidgetConfig: {
      tenantId: string;
      apiUrl: string;
    };
  }
}

// CSS injected into Shadow DOM
const WIDGET_CSS = `
  * { box-sizing: border-box; }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

function mount() {
  const config = window.SalesWidgetConfig;
  if (!config?.tenantId || !config?.apiUrl) {
    console.warn("[SalesWidget] Missing SalesWidgetConfig. Set window.SalesWidgetConfig before loading widget.js");
    return;
  }

  // Find or create host element
  let host = document.getElementById("sales-widget");
  if (!host) {
    host = document.createElement("div");
    host.id = "sales-widget";
    document.body.appendChild(host);
  }

  // Create Shadow DOM
  let shadow: ShadowRoot;
  try {
    shadow = host.attachShadow({ mode: "open" });
  } catch {
    // Already has shadow root
    shadow = host.shadowRoot!;
  }

  // Inject styles
  const styleEl = document.createElement("style");
  styleEl.textContent = WIDGET_CSS;
  shadow.appendChild(styleEl);

  // Mount React app into Shadow DOM
  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(<Widget config={config} />);
}

// Mount when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
