import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.connectedClients.delete(userId);
      }
    });
  }

  registerUser(userId: string, socketId: string) {
    this.connectedClients.set(userId, socketId);
  }

  notifyUser(userId: string, message: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', message);
    }
  }

  notifyProjectCollaborators(collaborators: string[], message: any) {
    collaborators.forEach((userId) => {
      this.notifyUser(userId, message);
    });
  }
}
