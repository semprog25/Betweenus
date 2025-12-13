import { useEffect, useState, useRef } from 'react';

interface LevelData {
  level: number;
  levelTitle: string;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

interface Notification {
  type: 'achievement' | 'level';
  data: any;
  id: string;
}

export function useAchievementNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const previousLevelDataRef = useRef<LevelData | null>(null);

  const checkForNewAchievements = (newLevelData: LevelData) => {
    if (!newLevelData || !userId) return;

    const previousData = previousLevelDataRef.current;
    
    // First time loading - don't show notifications
    if (!previousData) {
      previousLevelDataRef.current = newLevelData;
      return;
    }

    const newNotifications: Notification[] = [];

    // Check for level up
    if (newLevelData.level > previousData.level) {
      newNotifications.push({
        type: 'level',
        data: {
          level: newLevelData.level,
          title: newLevelData.levelTitle,
        },
        id: `level-${newLevelData.level}-${Date.now()}`,
      });
    }

    // Check for new badges
    const previousBadgeIds = new Set(previousData.badges.map(b => b.id));
    const newBadges = newLevelData.badges.filter(badge => !previousBadgeIds.has(badge.id));
    
    newBadges.forEach(badge => {
      // Don't show "Getting Started" badge notification
      if (badge.id !== 'getting-started') {
        newNotifications.push({
          type: 'achievement',
          data: badge,
          id: `badge-${badge.id}-${Date.now()}`,
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }

    previousLevelDataRef.current = newLevelData;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    checkForNewAchievements,
    dismissNotification,
    clearAllNotifications,
  };
}
