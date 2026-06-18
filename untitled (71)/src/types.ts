export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
  isTwoFactorEnabled?: boolean;
}

export interface VideoContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  category: string;
  views: number;
  isFeatured: boolean;
  qualityLevels: string[];
  createdAt: string;
  updatedAt?: string;
  authorName: string;
  videoType?: 'short' | 'long';
  duration?: number;
  tags: string[];
}

export interface ArticleContent {
  id: string;
  slug: string;
  title: string;
  content: string; // Markdown text
  summary: string;
  coverUrl: string;
  category: string;
  views: number;
  readTime: number; // in minutes
  isFeatured: boolean;
  draft: boolean;
  createdAt: string;
  updatedAt?: string;
  authorName: string;
  authorRole: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryItem {
  id: string;
  name: string; // e.g. "古兰经译解" (Quran Commentary), "历史文化" (History & Culture)
  slug: string;
  description: string;
  type: 'video' | 'article' | 'both';
  displayOrder: number;
  icon: string; // lucide icon name
}

export interface ActivityAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  entityTypeType: 'video' | 'article' | 'category' | 'auth' | 'user';
  entityId: string;
  details: string;
  timestamp: string;
}
