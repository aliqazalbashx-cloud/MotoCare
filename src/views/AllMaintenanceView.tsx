import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { AddScheduleModal } from '../components/maintenance/AddScheduleModal.tsx';
import { calculateScheduleStatus } from '../lib/calculations.ts';
import {
  CalendarCheck,
  Plus,
  Bike,
  Wrench,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface AllMaintenanceViewProps {
  onNavigateToBike: (bikeId: number) => void;
  onOpenAddSchedule: () => void;
  onOpenAddServiceForBike: (bikeId: number) => void;
}

export const AllMaintenanceView: React.FC<AllMaintenanceViewProps> = ({
  onNavigateToBike,
  onOpenAddSchedule,
  onOpenAddServiceForBike,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [bikes, setBikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchBikesAndSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/api/motorcycles');
      setBikes(data);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to load maintenance schedules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBikesAndSchedules();
  }, []);

  const handleToggle = async (scheduleId: number) => {
    try {
      await apiFetch(`/api/schedules/${scheduleId}/toggle`, { method: 'PATCH' });
      success('Schedule updated.');
      await fetchBikesAndSchedules();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to toggle schedule.');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/schedules/${deleteId}`, { method: 'DELETE' });
      success('Schedule deleted.');
      setDeleteId(null);
      await fetchBikesAndSchedules();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to delete schedule.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Auditing maintenance schedules..." />;
  }

  // Gather all schedules across bikes
  const allSchedulesList: any[] = [];
  bikes.forEach((bike) => {
    (bike.schedules || []).forEach((sched: any) => {
      const calc = calculateScheduleStatus(
        bike.currentMileage,
        sched.intervalKm,
        sched.lastCompletedMileage ?? 0,
        sched.intervalDays,
        sched.lastCompletedDate
      );
      allSchedulesList.push({
        ...sched,
        bike,
        calc,
      });
    });
  });

  // Sort by priority (overdue first, then due, then due soon, then up-to-date)
  allSchedulesList.sort((a, b) => a.calc.kmRemaining - b.calc.kmRemaining);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Maintenance Schedules ({allSchedulesList.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Automated recurring maintenance tracking based on mileage and time intervals.
          </p>
        </div>

        <button
          onClick={() => (bikes.length > 0 ? setIsAddOpen(true) : onOpenAddSchedule())}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {allSchedulesList.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
          <CalendarCheck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200 mb-1">
            No maintenance schedules configured
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Create recurring intervals to get automated alerts for oil changes, chains, and inspections.
          </p>
          {bikes.length > 0 && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
            >
              Add First Schedule
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSchedulesList.map((item) => {
            const { calc, bike } = item;
            return (
              <div
                key={item.id}
                className={`p-5 bg-zinc-900 border rounded-2xl flex flex-col justify-between transition ${
                  item.isEnabled ? 'border-zinc-800' : 'border-zinc-850 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => onNavigateToBike(bike.id)}
                          className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-rose-400 hover:bg-zinc-750 flex items-center gap-1 transition"
                        >
                          <Bike className="w-3 h-3" />
                          <span>{bike.brand} {bike.model}</span>
                        </button>
                      </div>
                      <h4 className="text-base font-bold text-zinc-100">
                        {item.maintenanceType}
                      </h4>
                      <span className="text-xs text-zinc-400">
                        Every {Number(item.intervalKm).toLocaleString()} km
                        {item.intervalDays ? ` or ${item.intervalDays} days` : ''}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${calc.badgeColor.bg} ${calc.badgeColor.text} ${calc.badgeColor.border}`}
                    >
                      {calc.statusLabel}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>
                        {calc.kmSinceLast.toLocaleString()} / {item.intervalKm.toLocaleString()} km used
                      </span>
                      <span className="font-bold">{calc.percentageUsed}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          calc.status === 'overdue'
                            ? 'bg-rose-500'
                            : calc.status === 'due'
                            ? 'bg-orange-500'
                            : calc.status === 'due-soon'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, calc.percentageUsed)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-950/60 rounded-xl text-xs mb-3 border border-zinc-850">
                    <div>
                      <span className="text-zinc-500 text-[10px] block uppercase">Last Done</span>
                      <span className="font-semibold text-zinc-300">
                        {item.lastCompletedMileage ? `${Number(item.lastCompletedMileage).toLocaleString()} km` : 'Never'}
                        {item.lastCompletedDate ? ` (${item.lastCompletedDate})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block uppercase">Remaining</span>
                      <span
                        className={`font-semibold ${
                          calc.kmRemaining < 0
                            ? 'text-rose-400'
                            : calc.kmRemaining <= 0
                            ? 'text-orange-400'
                            : 'text-zinc-300'
                        }`}
                      >
                        {calc.kmRemaining < 0
                          ? `Overdue by ${Math.abs(calc.kmRemaining).toLocaleString()} km`
                          : calc.kmRemaining === 0
                          ? 'Due now'
                          : `${calc.kmRemaining.toLocaleString()} km`}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-zinc-400 italic mb-2">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-850 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={item.isEnabled}
                      onChange={() => handleToggle(item.id)}
                      className="rounded text-rose-600 bg-zinc-950 border-zinc-800"
                    />
                    <span>Active</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenAddServiceForBike(bike.id)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Log Service</span>
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-zinc-500 hover:text-rose-400 transition ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Schedule Modal */}
      {isAddOpen && (
        <AddScheduleModal
          isOpen={true}
          motorcycles={bikes}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            setIsAddOpen(false);
            fetchBikesAndSchedules();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Schedule"
        message="Are you sure you want to delete this maintenance schedule?"
        confirmText="Delete Schedule"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
