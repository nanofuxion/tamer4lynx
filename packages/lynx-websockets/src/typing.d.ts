declare let NativeModules: {
  LynxWebSocketModule: {
    connect(url: string, id: number): void;
    send(id: number, message: string): void;
    close(id: number, code: number, reason: string): void;
  };
};

declare class WebSocket {
  constructor(url: string);

  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (error: Error) => void;
  onclose: (event: { code: number; reason: string }) => void;

  send(message: string): void;
  close(code?: number, reason?: string): void;
}