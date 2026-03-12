import { useEffect, useRef, useCallback } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

export function useSignalR(apiUrl: string, tenantId: string) {
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef(false);

  const getConnection = useCallback(async (): Promise<HubConnection> => {
    if (connectionRef.current?.state === "Connected") {
      return connectionRef.current;
    }

    if (connectingRef.current) {
      // Wait for ongoing connection
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!connectingRef.current) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
      return connectionRef.current!;
    }

    connectingRef.current = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat?tenantId=${tenantId}`, {
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    await connection.start();
    connectionRef.current = connection;
    connectingRef.current = false;
    return connection;
  }, [apiUrl, tenantId]);

  useEffect(() => {
    return () => {
      connectionRef.current?.stop();
    };
  }, []);

  return { getConnection };
}
