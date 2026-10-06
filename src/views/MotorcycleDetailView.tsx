import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { EditMotorcycleModal } from '../components/motorcycles/EditMotorcycleModal.tsx';
import { AddServiceModal } from '../components/services/AddServiceModal.tsx';
import { AddScheduleModal } from '../components/maintenance/AddScheduleModal.tsx';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal.tsx';
import {
  calculateHealthScore,
  calculateScheduleStatus,
} from '../lib/calculations.ts';
import {
  Bike,
  Wrench,
  CalendarCheck,
  Receipt,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';

interface MotorcycleDetailViewProps {
  motorcycleId: number;
  onBack: () => void;
}

type TabType = 'timeline' | 'schedules' | 'services' | 'expenses';

export const MotorcycleDetailView: React.FC<MotorcycleDetailViewProps> = ({
  motorcycleId,
  onBack,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [bike, setBike] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  // Modals
  const [isEditBikeOpen, setIsEditBikeOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Deletion confirm state
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'bike' | 'service' | 'schedule' | 'expense';
    id: number;
    title: string;
    message: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  const fetchBikeData = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch(`/api/motorcycles/${motorcycleId}`);
      setBike(data);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to load motorcycle details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBikeData();
  }, [motorcycleId]);

  const handleDeleteItem = async () => {
    if (!deleteDialog) return;
    setIsDeleting(true);
    try {
      if (deleteDialog.type === 'bike') {
        await apiFetch(`/api/motorcycles/${deleteDialog.id}`, { method: 'DELETE' });
        success('Motorcycle deleted successfully.');
        setDeleteDialog(null);
        onBack();
        return;
      } else if (deleteDialog.type === 'service') {
        await apiFetch(`/api/services/${deleteDialog.id}`, { method: 'DELETE' });
        success('Service record deleted.');
      } else if (deleteDialog.type === 'schedule') {
        await apiFetch(`/api/schedules/${deleteDialog.id}`, { method: 'DELETE' });
        success('Maintenance schedule deleted.');
      } else if (deleteDialog.type === 'expense') {
        await apiFetch(`/api/expenses/${deleteDialog.id}`, { method: 'DELETE' });
        success('Expense deleted.');
      }
      setDeleteDialog(null);
      await fetchBikeData();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Deletion failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: number) => {
    try {
      await apiFetch(`/api/schedules/${scheduleId}/toggle`, { method: 'PATCH' });
      success('Schedule status updated.');
      await fetchBikeData();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to update schedule status.');
    }
  };

  const handleResetScheduleDefaults = async () => {
    try {
      await apiFetch(`/api/schedules/motorcycle/${motorcycleId}/reset-defaults`, {
        method: 'POST',
      });
      success('Recommended maintenance presets restored.');
      await fetchBikeData();
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to reset default schedules.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Fetching motorcycle telemetry and service history..." />;
  }

  if (!bike) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400 mb-4">Motorcycle not found or access denied.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-zinc-800 text-zinc-100 rounded-xl"
        >
          Return to Garage
        </button>
      </div>
    );
  }

  const health = calculateHealthScore(bike.schedules || [], bike.currentMileage);
  const healthBadge =
    health.score >= 80
      ? { bg: 'bg-emerald-950/70', text: 'text-emerald-400', border: 'border-emerald-800/80' }
      : health.score >= 50
      ? { bg: 'bg-amber-950/70', text: 'text-amber-400', border: 'border-amber-800/80' }
      : { bg: 'bg-rose-950/70', text: 'text-rose-400', border: 'border-rose-800/80' };

  // Calculate next recommended maintenance item
  let nextServiceAlert: any = null;
  const activeSchedulesWithCalc = (bike.schedules || [])
    .filter((s: any) => s.isEnabled)
    .map((s: any) => {
      const calc = calculateScheduleStatus(
        bike.currentMileage,
        s.intervalKm,
        s.lastCompletedMileage ?? 0,
        s.intervalDays,
        s.lastCompletedDate
      );
      return { ...s, calc };
    })
    .sort((a: any, b: any) => a.calc.kmRemaining - b.calc.kmRemaining);

  if (activeSchedulesWithCalc.length > 0) {
    nextServiceAlert = activeSchedulesWithCalc[0];
  }

  // Unified timeline combining services and expenses
  const timelineEvents = [
    ...(bike.services || []).map((s: any) => ({
      id: `svc-${s.id}`,
      originalId: s.id,
      eventType: 'service' as const,
      date: s.serviceDate,
      title: s.serviceType,
      amount: parseFloat(s.cost || '0'),
      mileage: s.mileage,
      details: s.partsReplaced,
      notes: s.notes,
    })),
    ...(bike.expenses || []).map((e: any) => ({
      id: `exp-${e.id}`,
      originalId: e.id,
      eventType: 'expense' as const,
      date: e.expenseDate,
      title: `${e.category}: ${e.description}`,
      amount: parseFloat(e.amount || '0'),
      mileage: null,
      details: e.category,
      notes: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtered Services
  const filteredServices = (bike.services || []).filter((s: any) => {
    const matchesSearch =
      !searchFilter ||
      s.serviceType.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (s.partsReplaced && s.partsReplaced.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesType =
      serviceTypeFilter === 'ALL' || s.serviceType === serviceTypeFilter;

    return matchesSearch && matchesType;
  });

  // Filtered Expenses
  const filteredExpenses = (bike.expenses || []).filter((e: any) => {
    const matchesSearch =
      !searchFilter ||
      e.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.category.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesCat =
      expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition"
            aria-label="Back to Garage"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                {bike.brand} {bike.model}
              </h1>
              {bike.nickname && (
                <span className="text-sm font-semibold text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {bike.nickname}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              {bike.year} • {bike.registrationNumber || 'No plate entered'} • {Number(bike.currentMileage).toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddServiceOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md shadow-rose-950/40"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Log Service</span>
          </button>
          <button
            onClick={() => setIsAddScheduleOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-zinc-200 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 transition flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Schedule</span>
          </button>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-zinc-200 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 transition flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setIsEditBikeOpen(true)}
            title="Edit Motorcycle"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setDeleteDialog({
                type: 'bike',
                id: bike.id,
                title: 'Delete Motorcycle',
                message: `Are you sure you want to permanently remove ${bike.brand} ${bike.model} and all its service logs?`,
              })
            }
            title="Delete Motorcycle"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-900 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Automotive Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Odometer"
          value={`${Number(bike.currentMileage).toLocaleString()} km`}
          subtext="Updated with service records"
          icon={<Bike className="w-4 h-4" />}
          accentColor="red"
        />

        <StatCard
          label="Maintenance Health"
          value={`${health.score}/100`}
          subtext={health.summary}
          icon={<Sparkles className="w-4 h-4" />}
          accentColor={health.score >= 80 ? 'emerald' : health.score >= 50 ? 'amber' : 'red'}
        />

        <StatCard
          label="Last Service"
          value={
            bike.services?.[0]
              ? bike.services[0].serviceType
              : 'None'
          }
          subtext={
            bike.services?.[0]
              ? `${Number(bike.services[0].mileage).toLocaleString()} km • ${bike.services[0].serviceDate}`
              : 'Log your first service'
          }
          icon={<Wrench className="w-4 h-4" />}
          accentColor="amber"
        />

        <StatCard
          label="Next Service Alert"
          value={
            nextServiceAlert
              ? nextServiceAlert.maintenanceType
              : 'All up to date'
          }
          subtext={
            nextServiceAlert
              ? nextServiceAlert.calc.kmRemaining < 0
                ? `Overdue by ${Math.abs(nextServiceAlert.calc.kmRemaining).toLocaleString()} km`
                : `In ~${nextServiceAlert.calc.kmRemaining.toLocaleString()} km`
              : 'No pending maintenance'
          }
          icon={<CalendarCheck className="w-4 h-4" />}
          accentColor={nextServiceAlert && nextServiceAlert.calc.kmRemaining <= 0 ? 'red' : 'blue'}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 flex items-center gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('timeline');
            setSearchFilter('');
          }}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Service Timeline</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
            {timelineEvents.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('schedules');
            setSearchFilter('');
          }}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'schedules'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Maintenance Schedules</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
            {bike.schedules?.length || 0}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('services');
            setSearchFilter('');
          }}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Service Records</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
            {bike.services?.length || 0}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('expenses');
            setSearchFilter('');
          }}
          className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-400">
            {bike.expenses?.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Chronological Event Timeline
            </h3>
            <span className="text-xs text-zinc-500">
              Combined maintenance logs and operating expenses
            </span>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No events logged yet.</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Log a completed service or expense to start building this motorcycle's history.
              </p>
              <button
                onClick={() => setIsAddServiceOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
              >
                Log First Service
              </button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
              {timelineEvents.map((evt) => {
                const isService = evt.eventType === 'service';
                return (
                  <div key={evt.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border ${
                        isService
                          ? 'bg-rose-950 border-rose-500 text-rose-400'
                          : 'bg-amber-950 border-amber-500 text-amber-400'
                      }`}
                    >
                      {isService ? (
                        <Wrench className="w-2.5 h-2.5" />
                      ) : (
                        <Receipt className="w-2.5 h-2.5" />
                      )}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isService
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isService ? 'Service' : 'Expense'}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-100">
                            {evt.title}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-zinc-200">
                            Rs. {evt.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                        <span>{evt.date}</span>
                        {evt.mileage !== null && (
                          <span>• {Number(evt.mileage).toLocaleString()} km</span>
                        )}
                        {evt.details && <span>• {evt.details}</span>}
                      </div>

                      {evt.notes && (
                        <p className="text-xs text-zinc-400 mt-2 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-850">
                          {evt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAINTENANCE SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Recurring Maintenance Schedules
              </h3>
              <p className="text-xs text-zinc-400">
                Automated status calculated by mileage and elapsed time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetScheduleDefaults}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition flex items-center gap-1.5"
                title="Restore default presets (Oil, Chain, Brakes, General Inspection)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                onClick={() => setIsAddScheduleOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Schedule</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSchedulesWithCalc.map((item: any) => {
              const { calc } = item;
              return (
                <div
                  key={item.id}
                  className={`p-5 bg-zinc-900 border rounded-2xl flex flex-col justify-between transition ${
                    item.isEnabled ? 'border-zinc-800' : 'border-zinc-850 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
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

                  {/* Actions strip */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={item.isEnabled}
                        onChange={() => handleToggleSchedule(item.id)}
                        className="rounded text-rose-600 bg-zinc-950 border-zinc-800"
                      />
                      <span>Active</span>
                    </label>

                    <button
                      onClick={() =>
                        setDeleteDialog({
                          type: 'schedule',
                          id: item.id,
                          title: 'Delete Schedule',
                          message: `Are you sure you want to delete the schedule for "${item.maintenanceType}"?`,
                        })
                      }
                      className="text-zinc-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SERVICE RECORDS */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Service History Log
              </h3>
              <p className="text-xs text-zinc-400">
                Detailed maintenance history, parts replaced, and costs.
              </p>
            </div>
            <button
              onClick={() => setIsAddServiceOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Service Record</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search service type, parts, or notes..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Wrench className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No service records found.</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Record your oil changes, inspections, and repair jobs.
              </p>
              <button
                onClick={() => setIsAddServiceOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
              >
                Log Service Record
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServices.map((svc: any) => (
                <div
                  key={svc.id}
                  className="p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100">
                        {svc.serviceType}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {Number(svc.mileage).toLocaleString()} km
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center gap-3">
                      <span>{svc.serviceDate}</span>
                      {svc.partsReplaced && (
                        <span>• Parts: <strong className="text-zinc-300">{svc.partsReplaced}</strong></span>
                      )}
                    </div>

                    {svc.notes && (
                      <p className="text-xs text-zinc-400 mt-1.5 italic">
                        "{svc.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-850">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-zinc-500 block uppercase">Cost</span>
                      <span className="text-base font-black text-zinc-100">
                        Rs. {Number(svc.cost).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setDeleteDialog({
                          type: 'service',
                          id: svc.id,
                          title: 'Delete Service Record',
                          message: `Are you sure you want to delete this "${svc.serviceType}" service record?`,
                        })
                      }
                      title="Delete record"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-900 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Operating Expenses
              </h3>
              <p className="text-xs text-zinc-400">
                Fuel refills, parts, accessories, insurance, and gear.
              </p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search description or category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
              <Receipt className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No expenses recorded.</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                Record receipts for fuel, modifications, and accessories.
              </p>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp: any) => (
                <div
                  key={exp.id}
                  className="p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100">
                        {exp.description}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{exp.expenseDate}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-850">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-zinc-500 block uppercase">Amount</span>
                      <span className="text-base font-black text-zinc-100">
                        Rs. {Number(exp.amount).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setDeleteDialog({
                          type: 'expense',
                          id: exp.id,
                          title: 'Delete Expense',
                          message: `Are you sure you want to delete this expense of Rs. ${exp.amount}?`,
                        })
                      }
                      title="Delete expense"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-900 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Motorcycle Modal */}
      {isEditBikeOpen && (
        <EditMotorcycleModal
          isOpen={true}
          motorcycle={bike}
          onClose={() => setIsEditBikeOpen(false)}
          onSuccess={() => {
            setIsEditBikeOpen(false);
            fetchBikeData();
          }}
        />
      )}

      {/* Add Service Modal */}
      {isAddServiceOpen && (
        <AddServiceModal
          isOpen={true}
          motorcycles={[bike]}
          defaultMotorcycleId={bike.id}
          onClose={() => setIsAddServiceOpen(false)}
          onSuccess={() => {
            setIsAddServiceOpen(false);
            fetchBikeData();
          }}
        />
      )}

      {/* Add Schedule Modal */}
      {isAddScheduleOpen && (
        <AddScheduleModal
          isOpen={true}
          motorcycles={[bike]}
          defaultMotorcycleId={bike.id}
          onClose={() => setIsAddScheduleOpen(false)}
          onSuccess={() => {
            setIsAddScheduleOpen(false);
            fetchBikeData();
          }}
        />
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={true}
          motorcycles={[bike]}
          defaultMotorcycleId={bike.id}
          onClose={() => setIsAddExpenseOpen(false)}
          onSuccess={() => {
            setIsAddExpenseOpen(false);
            fetchBikeData();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog !== null}
        onClose={() => setDeleteDialog(null)}
        onConfirm={handleDeleteItem}
        title={deleteDialog?.title || 'Confirm Deletion'}
        message={deleteDialog?.message || 'Are you sure?'}
        confirmText="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
