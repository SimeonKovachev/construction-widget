import { useState, useEffect } from "react";
import ChatButton from "./components/ChatButton";
import ChatWindow from "./components/ChatWindow";

interface WidgetConfig {
  tenantId: string;
  apiUrl: string;
}

interface TenantConfig {
  tenantId: string;
  tenantName: string;
  greeting: string;
}

export default function Widget({ config }: { config: WidgetConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${config.apiUrl}/api/widget/config`, {
      headers: { "X-Tenant-ID": config.tenantId },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Widget configuration failed");
        return res.json();
      })
      .then((data: TenantConfig) => setTenantConfig(data))
      .catch(() => setError("Widget unavailable"));
  }, [config.apiUrl, config.tenantId]);

  if (error) return null;
  if (!tenantConfig) return null;

  return (
    <>
      <ChatButton isOpen={isOpen} onClick={() => setIsOpen((o) => !o)} />
      {isOpen && (
        <ChatWindow
          tenantId={tenantConfig.tenantId}
          apiUrl={config.apiUrl}
          tenantName={tenantConfig.tenantName}
          greeting={tenantConfig.greeting}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
