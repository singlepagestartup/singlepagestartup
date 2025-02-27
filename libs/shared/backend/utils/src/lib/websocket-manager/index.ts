import { type ServerWebSocket } from "bun";

class WebSocketManager {
  private static instance: WebSocketManager;
  private clients: Map<string, ServerWebSocket<undefined>>;

  private constructor() {
    this.clients = new Map();
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public addClient(id: string, ws: any) {
    this.clients.set(id, ws);
    console.log(
      `New WebSocket connection (ID: ${id}, ${this.clients.size} active)`,
    );
  }

  public removeClient(id: string) {
    if (this.clients.has(id)) {
      this.clients.delete(id);
      console.log(
        `Client disconnected (ID: ${id}, ${this.clients.size} active)`,
      );
    } else {
      console.log(`WebSocket ID ${id} not found in clients set`);
    }
  }

  public broadcastMessage(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(data);
      }
    });
  }
}

export const util = WebSocketManager.getInstance();
