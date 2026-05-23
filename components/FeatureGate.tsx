import { FEATURES, FeatureKey } from '@/config/features';

export function FeatureGate({
  feature,
  children,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
}) {
  if (!FEATURES[feature]) return null;
  return <>{children}</>;
}
