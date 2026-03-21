export interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  position: "bottom-right" | "bottom-left";
  agentName: string;
  agentAvatarUrl: string | null;
}

export const DEFAULT_THEME: WidgetTheme = {
  primaryColor: "#2563eb",
  secondaryColor: "#1d4ed8",
  logoUrl: null,
  position: "bottom-right",
  agentName: "Sales Assistant",
  agentAvatarUrl: null,
};

export function buildTheme(config: Record<string, unknown>): WidgetTheme {
  return {
    primaryColor: (config.primaryColor as string) || DEFAULT_THEME.primaryColor,
    secondaryColor: (config.secondaryColor as string) || DEFAULT_THEME.secondaryColor,
    logoUrl: (config.logoUrl as string) || null,
    position: config.position === "bottom-left" ? "bottom-left" : "bottom-right",
    agentName: (config.agentName as string) || DEFAULT_THEME.agentName,
    agentAvatarUrl: (config.agentAvatarUrl as string) || null,
  };
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
