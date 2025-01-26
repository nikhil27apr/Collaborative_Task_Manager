import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
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
  private offlineNotifications = new Map<string, any[]>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: { data: { userId: string } }) {
    if (!payload || !payload.data || !payload.data.userId) {
      console.error('Invalid registration payload:', payload);
      return;
    }

    console.log('Received register payload:', payload);
    const { userId } = payload.data;
    this.connectedClients.set(userId, client.id);
    console.log(`User registered: ${userId} with socket ID: ${client.id}`);

    // Send any offline notifications
    const notifications = this.offlineNotifications.get(userId) || [];
    notifications.forEach(notification => {
      this.server.to(client.id).emit('notification', notification);
      console.log(`Sent offline notification to user ${userId}:`, notification);
    });
    this.offlineNotifications.delete(userId);
  }

  notifyUser(userId: string, notification: any) {
    const socketId = this.connectedClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      console.log(`Notification sent to user ${userId}:`, notification);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }

  notifyProjectCollaborators(collaborators: string[], message: any) {
    collaborators.forEach((userId) => {
      this.notifyUser(userId, message);
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.connectedClients.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  }
}
