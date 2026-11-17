import type { SafetyTier } from '../types/weather';

interface StatusBadgeProps {
  tier: SafetyTier;
  label: string;
  compact?: boolean;
}

const TIER_STYLES: Record<SafetyTier, string> = {
  optimal: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  poor: 'bg-red-50 text-red-800 border-red-200',
};

export function StatusBadge({ tier, label, compact = false }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border font-medium whitespace-nowrap shrink-0 rounded-md ${
        TIER_STYLES[tier]
      } ${compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
    >
      {label}
    </span>
  );
}
