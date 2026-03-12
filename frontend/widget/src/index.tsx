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

// CSS injected into Shadow DOM — all animations for the chat widget live here.
// They MUST be defined inside the Shadow DOM <style> tag; external stylesheets
// and host-page keyframes are not visible inside the shadow boundary.
const WIDGET_CSS = `
  * { box-sizing: border-box; }

  /* Typing indicator: 3 dots bounce sequentially */
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
    30%           { transform: translateY(-6px);  opacity: 1;   }
  }

  /* Blinking cursor shown while AI text is streaming */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0; }
  }

  /* Pulsing green dot in header "Typing..." status */
  @keyframes pulse {
    0%, 100% { opacity: 1;    transform: scale(1);    }
    50%      { opacity: 0.35; transform: scale(0.75); }
  }

  /* Spinner on the send button while streaming */
  @keyframes spin {
    to { transform: rotate(360deg); }
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
