import { redirect } from 'next/navigation';

/**
 * Redirect old dashboard route to new location for backwards compatibility
 */
export default function OldDashboard() {
  redirect('/dashboard/flows-migrator');
}
