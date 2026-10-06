import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { EditMotorcycleModal } from '../components/motorcycles/EditMotorcycleModal.tsx';
import { calculateHealthScore } from '../lib/calculations.ts';
import {
  Bike,
  Plus,
  Wrench,
  Gauge,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Hash,
} from 'lucide-react';

interface GarageViewProps {
  onNavigateToBike: (bikeId: number) => void;
  onOpenAddBike: () => void;
  onOpenAddServiceForBike: (bikeId: number) => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  onNavigateToBike,
  onOpenAddBike,
  onOpenAddServiceForBike,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [bikes, setBikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit state
  const [editBike, setEditBike] = useState<any | null>(null);

  const fetchBikes = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch('/api/motorcycles');
      setBikes(data);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to load garage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/motorcycles/${deleteId}`, {
        method: 'DELETE',
      });
      success('Motorcycle and related records deleted successfully.');
      setBikes((prev) => prev.filter((b) => b.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to delete motorcycle.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Opening garage doors..." />;
  }

  if (bikes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
              My Garage
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your motorcycles, odometers, and service logs.
            </p>
          </div>
        </div>
        <EmptyState
          icon={Bike}
          title="Your garage is empty."
          description="You haven't parked any motorcycles in your digital garage yet. Add one now to start tracking maintenance intervals."
          actionText="Add Motorcycle"
          onAction={onOpenAddBike}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            My Garage ({bikes.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time telemetry and service tracking for your machines.
          </p>
        </div>

        <button
          onClick={onOpenAddBike}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Motorcycle</span>
        </button>
      </div>

      {/* Motorcycle Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bikes.map((bike) => {
          const health = calculateHealthScore(
            bike.schedules || [],
            bike.currentMileage
          );

          const healthBadge =
            health.score >= 80
              ? { bg: 'bg-emerald-950/70', text: 'text-emerald-400', border: 'border-emerald-800/80' }
              : health.score >= 50
              ? { bg: 'bg-amber-950/70', text: 'text-amber-400', border: 'border-amber-800/80' }
              : { bg: 'bg-rose-950/70', text: 'text-rose-400', border: 'border-rose-800/80' };

          return (
            <div
              key={bike.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl hover:border-zinc-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Visual Top Bar / Image */}
                <div className="relative h-44 w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
                  {bike.imageUrl ? (
                    <img
                      src={bike.imageUrl}
                      alt={`${bike.brand} ${bike.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-700">
                      <Bike className="w-16 h-16 opacity-40 text-rose-500" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mt-1">
                        {bike.brand}
                      </span>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md text-xs font-bold text-zinc-100 border border-zinc-800 shadow">
                      {bike.year}
                    </span>
                    {bike.registrationNumber && (
                      <span className="px-2.5 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-md text-xs font-semibold text-zinc-300 border border-zinc-800 flex items-center gap-1 shadow">
                        <Hash className="w-3 h-3 text-zinc-500" />
                        {bike.registrationNumber}
                      </span>
                    )}
                  </div>

                  {/* Health score badge */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`px-3 py-1 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Health: {health.score}/100</span>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-xl font-black text-zinc-100 tracking-tight">
                        {bike.brand} {bike.model}
                      </h2>
                      {bike.nickname && (
                        <span className="text-sm font-semibold text-rose-400">
                          "{bike.nickname}"
                        </span>
                      )}
                    </div>
                    {bike.notes && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                        {bike.notes}
                      </p>
                    )}
                  </div>

                  {/* Quick stats strip */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-950/60 rounded-2xl border border-zinc-850 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Odometer
                      </span>
                      <span className="text-sm font-extrabold text-zinc-200">
                        {Number(bike.currentMileage).toLocaleString()} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Total Spent
                      </span>
                      <span className="text-sm font-extrabold text-zinc-200">
                        Rs. {Math.round(bike.totalSpent || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Schedules
                      </span>
                      <span className="text-sm font-extrabold text-zinc-200">
                        {bike.scheduleCount || 0} Active
                      </span>
                    </div>
                  </div>

                  {/* Last service info */}
                  <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="text-zinc-400 block text-[11px]">Last Service</span>
                        <span className="font-semibold text-zinc-200">
                          {bike.lastService
                            ? `${bike.lastService.serviceType} (${Number(bike.lastService.mileage).toLocaleString()} km)`
                            : 'No services logged yet'}
                        </span>
                      </div>
                    </div>
                    {bike.lastService && (
                      <span className="text-zinc-400 text-[11px]">
                        {bike.lastService.serviceDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <button
                  onClick={() => onNavigateToBike(bike.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5"
                >
                  <Gauge className="w-4 h-4" />
                  <span>Open Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenAddServiceForBike(bike.id)}
                  title="Log Service Record"
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 transition"
                >
                  <Wrench className="w-4 h-4 text-rose-400" />
                </button>
                <button
                  onClick={() => setEditBike(bike)}
                  title="Edit Motorcycle"
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(bike.id)}
                  title="Delete Motorcycle"
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-900 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Motorcycle Modal */}
      {editBike && (
        <EditMotorcycleModal
          isOpen={true}
          motorcycle={editBike}
          onClose={() => setEditBike(null)}
          onSuccess={() => {
            setEditBike(null);
            fetchBikes();
          }}
        />
      )}

      {/* Delete Motorcycle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Motorcycle from Garage"
        message="Are you sure you want to delete this motorcycle? All associated service logs, recurring maintenance schedules, and expense records will also be permanently removed."
        confirmText="Delete Motorcycle"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
