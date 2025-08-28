import { UserPermissions } from '../types';

export function getDefaultPermissions(role: 'admin' | 'moderator' | 'teacher' | 'student'): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canCreateArticles: true,
        canModerateContent: true,
        canManageUsers: true,
        canAccessAnalytics: true,
        canDeleteContent: true,
        canBanUsers: true,
      };
    case 'moderator':
      return {
        canCreateArticles: true,
        canModerateContent: true,
        canManageUsers: false,
        canAccessAnalytics: true,
        canDeleteContent: true,
        canBanUsers: true,
      };
    case 'teacher':
      return {
        canCreateArticles: true,
        canModerateContent: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canDeleteContent: false,
        canBanUsers: false,
      };
    case 'student':
    default:
      return {
        canCreateArticles: false,
        canModerateContent: false,
        canManageUsers: false,
        canAccessAnalytics: false,
        canDeleteContent: false,
        canBanUsers: false,
      };
  }
}
