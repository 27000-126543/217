import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  roles: string[];
  subscribedTopics: string[];
}

class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws,
        roles: [],
        subscribedTopics: [],
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (e) {
          console.error("WebSocket message parse error:", e);
        }
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
      });

      ws.send(
        JSON.stringify({
          type: "connected",
          clientId,
          timestamp: new Date().toISOString(),
        })
      );
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "authenticate":
        client.userId = message.userId;
        client.roles = message.roles || [];
        break;
      case "subscribe":
        if (message.topics) {
          client.subscribedTopics.push(...message.topics);
        }
        break;
      case "unsubscribe":
        if (message.topics) {
          client.subscribedTopics = client.subscribedTopics.filter(
            (t) => !message.topics.includes(t)
          );
        }
        break;
    }
  }

  broadcast(topic: string, data: any, targetRoles?: string[]) {
    const message = JSON.stringify({
      type: topic,
      data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.ws.readyState !== WebSocket.OPEN) return;

      const hasTopic = client.subscribedTopics.includes(topic) || topic === "all";
      const hasRole =
        !targetRoles ||
        targetRoles.length === 0 ||
        client.roles.some((r) => targetRoles.includes(r));

      if (hasTopic && hasRole) {
        client.ws.send(message);
      }
    });
  }

  sendToUser(userId: string, topic: string, data: any) {
    const message = JSON.stringify({
      type: topic,
      data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }
}

export const wsService = new WebSocketService();
