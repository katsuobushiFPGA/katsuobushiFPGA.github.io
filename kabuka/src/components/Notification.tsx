'use client';

import { useEffect, useState } from 'react';
import type { Notification as NotifType } from '@/lib/gameState';

interface Props {
  notifications: NotifType[];
}

export default function Notifications({ notifications }: Props) {
  const [visible, setVisible] = useState<NotifType[]>([]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    setVisible((prev) => [...prev, latest]);

    const timer = setTimeout(() => {
      setVisible((prev) => prev.filter((n) => n.id !== latest.id));
    }, 3000);

    return () => clearTimeout(timer);
  }, [notifications.length]);

  const colorMap = {
    success: 'bg-green-900 border-green-500',
    error: 'bg-red-900 border-red-500',
    info: 'bg-blue-900 border-blue-500',
  };

  return (
    <div className="fixed top-16 right-4 z-40 space-y-2">
      {visible.map((n) => (
        <div
          key={n.id}
          className={`px-4 py-2 rounded border text-sm text-gray-200 animate-slide-in ${colorMap[n.type]}`}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
