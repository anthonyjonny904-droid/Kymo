export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  timestamp: string; // ISO string or formatted
  status: MessageStatus;
  reaction?: string;
  type?: 'text' | 'voice' | 'image';
  mediaUrl?: string;
  voiceDuration?: string; // e.g. "0:14"
}

export interface UserContact {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  isOnline: boolean;
  activeChatId: string | null;
  lastSeenText: string;
  fcmToken: string | null;
  about?: string;
}

export interface ChatThread {
  id: string;
  peer: UserContact;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastSenderId: string;
  status: MessageStatus;
}

export interface FcmPushLog {
  id: string;
  timestamp: string;
  chatId: string;
  senderName: string;
  text: string;
  recipientId: string;
  recipientToken: string | null;
  isSuppressed: boolean;
  suppressReason?: string;
  payload?: any;
  status: 'sent' | 'suppressed' | 'failed';
}
