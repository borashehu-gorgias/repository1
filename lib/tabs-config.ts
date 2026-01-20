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
    id: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
  },
];
