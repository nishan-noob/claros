import { FeatureGate } from '@/components/FeatureGate';

export default function ParentMessagesPage() {
  return (
    <FeatureGate feature="PARENT_TEACHER_CHAT">
      <div className="p-4">
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="mt-2 text-sm text-slate-500">Messaging feature coming soon.</p>
      </div>
    </FeatureGate>
  );
}
