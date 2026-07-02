export type NotificationType = 'announcement' | 'holiday' | 'policy_update' | 'leave_update' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  audience_role: string | null;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  created_by_user?: { name: string } | null;
}
