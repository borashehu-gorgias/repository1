export interface Tab {
  id: string;
  label: string;
  path: string;
}

export const tabs: Tab[] = [
  {
    id: 'flows-migrator',
    label: 'Flows Migrator',
    path: '/dashboard/flows-migrator',
  },
  {
    id: 'ai-evaluation',
    label: 'AI Evaluation',
    path: '/dashboard/ai-evaluation',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
  },
];
