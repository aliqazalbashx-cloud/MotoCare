export type MaintenanceStatus = 'up-to-date' | 'due-soon' | 'due' | 'overdue';

export interface ScheduleCalculation {
  status: MaintenanceStatus;
  statusLabel: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  kmSinceLast: number;
  kmRemaining: number;
  daysSinceLast: number | null;
  daysRemaining: number | null;
  percentageUsed: number;
}

export function calculateScheduleStatus(
  currentMileage: number,
  intervalKm: number,
  lastCompletedMileage: number = 0,
  intervalDays?: number | null,
  lastCompletedDate?: string | null
): ScheduleCalculation {
  const kmSinceLast = Math.max(0, currentMileage - (lastCompletedMileage || 0));
  const kmRemaining = intervalKm - kmSinceLast;
  const mileagePercent = Math.min(200, Math.round((kmSinceLast / intervalKm) * 100));

  let daysSinceLast: number | null = null;
  let daysRemaining: number | null = null;
  let datePercent = 0;

  if (intervalDays && lastCompletedDate) {
    const lastDate = new Date(lastCompletedDate);
    if (!isNaN(lastDate.getTime())) {
      const today = new Date();
      const diffMs = today.getTime() - lastDate.getTime();
      daysSinceLast = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      daysRemaining = intervalDays - daysSinceLast;
      datePercent = Math.min(200, Math.round((daysSinceLast / intervalDays) * 100));
    }
  }

  // Combined worst status
  let status: MaintenanceStatus = 'up-to-date';

  const isMileageOverdue = kmRemaining < 0;
  const isMileageDue = kmRemaining === 0;
  const isMileageDueSoon = kmRemaining > 0 && (kmRemaining <= 150 || kmRemaining <= intervalKm * 0.15);

  const isDaysOverdue = daysRemaining !== null && daysRemaining < 0;
  const isDaysDue = daysRemaining !== null && daysRemaining === 0;
  const isDaysDueSoon =
    daysRemaining !== null &&
    daysRemaining > 0 &&
    (daysRemaining <= 7 || daysRemaining <= (intervalDays || 0) * 0.15);

  if (isMileageOverdue || isDaysOverdue) {
    status = 'overdue';
  } else if (isMileageDue || isDaysDue) {
    status = 'due';
  } else if (isMileageDueSoon || isDaysDueSoon) {
    status = 'due-soon';
  } else {
    status = 'up-to-date';
  }

  const badgeMap: Record<
    MaintenanceStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    'up-to-date': {
      label: 'Up to Date',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-800/60',
    },
    'due-soon': {
      label: 'Due Soon',
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-800/60',
    },
    due: {
      label: 'Due Now',
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-800/60',
    },
    overdue: {
      label: 'Overdue',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-800/60',
    },
  };

  const badgeInfo = badgeMap[status];

  return {
    status,
    statusLabel: badgeInfo.label,
    badgeColor: {
      bg: badgeInfo.bg,
      text: badgeInfo.text,
      border: badgeInfo.border,
    },
    kmSinceLast,
    kmRemaining,
    daysSinceLast,
    daysRemaining,
    percentageUsed: Math.max(mileagePercent, datePercent),
  };
}

export function calculateHealthScore(
  schedules: Array<{
    isEnabled: boolean;
    intervalKm: number;
    lastCompletedMileage?: number | null;
    intervalDays?: number | null;
    lastCompletedDate?: string | null;
  }>,
  currentMileage: number
): { score: number; rating: string; summary: string } {
  const activeSchedules = schedules.filter((s) => s.isEnabled);

  if (activeSchedules.length === 0) {
    return {
      score: 100,
      rating: 'Excellent',
      summary: 'No active maintenance schedules configured. Setup schedules to track health.',
    };
  }

  let totalPoints = 0;
  let overdueCount = 0;
  let dueCount = 0;
  let dueSoonCount = 0;

  for (const item of activeSchedules) {
    const calc = calculateScheduleStatus(
      currentMileage,
      item.intervalKm,
      item.lastCompletedMileage ?? 0,
      item.intervalDays,
      item.lastCompletedDate
    );

    if (calc.status === 'up-to-date') {
      totalPoints += 100;
    } else if (calc.status === 'due-soon') {
      totalPoints += 75;
      dueSoonCount++;
    } else if (calc.status === 'due') {
      totalPoints += 40;
      dueCount++;
    } else if (calc.status === 'overdue') {
      totalPoints += 0;
      overdueCount++;
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(totalPoints / activeSchedules.length)));

  let rating = 'Excellent';
  if (score < 40) rating = 'Needs Attention';
  else if (score < 70) rating = 'Fair';
  else if (score < 90) rating = 'Good';

  let summary = 'All scheduled maintenance items are up to date.';
  if (overdueCount > 0) {
    summary = `${overdueCount} maintenance item${overdueCount > 1 ? 's are' : ' is'} overdue.`;
  } else if (dueCount > 0) {
    summary = `${dueCount} maintenance item${dueCount > 1 ? 's are' : ' is'} due now.`;
  } else if (dueSoonCount > 0) {
    summary = `${dueSoonCount} maintenance item${dueSoonCount > 1 ? 's are' : ' is'} due soon.`;
  }

  return { score, rating, summary };
}

export const DEFAULT_MAINTENANCE_PRESETS = [
  {
    type: 'Oil Change',
    intervalKm: 1000,
    intervalDays: 90,
    notes: 'Engine oil and filter replacement as per routine riding.',
  },
  {
    type: 'Chain Service',
    intervalKm: 500,
    intervalDays: 30,
    notes: 'Clean, inspect slack, and lubricate drive chain.',
  },
  {
    type: 'Brake Inspection',
    intervalKm: 2000,
    intervalDays: 120,
    notes: 'Inspect brake pads thickness, discs, and fluid level.',
  },
  {
    type: 'General Inspection',
    intervalKm: 3000,
    intervalDays: 180,
    notes: 'Bolts, fasteners, coolant, cables, tire pressure and wear.',
  },
  {
    type: 'Battery Check',
    intervalKm: 5000,
    intervalDays: 180,
    notes: 'Inspect battery terminals, charge voltage, and electrolyte.',
  },
];
