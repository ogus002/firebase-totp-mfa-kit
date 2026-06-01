export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface ChatApiResponse {
  reply: string;
  sessionId: string;
  degraded?: boolean;
}
