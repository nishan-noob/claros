import { FeatureGate } from '@/components/FeatureGate';

export default function ParentAnnouncementsPage() {
  return (
    <FeatureGate feature="ANNOUNCEMENTS">
      <div className="p-4">
        <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
        <p className="mt-2 text-sm text-slate-500">Announcements feature coming soon.</p>
      </div>
    </FeatureGate>
  );
}
