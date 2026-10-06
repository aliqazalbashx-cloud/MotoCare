import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { AddServiceModal } from '../components/services/AddServiceModal.tsx';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Bike,
} from 'lucide-react';

interface AllServicesViewProps {
  onNavigateToBike: (bikeId: number) => void;
  onOpenAddService: () => void;
}

export const AllServicesView: React.FC<AllServicesViewProps> = ({
  onNavigateToBike,
  onOpenAddService,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [services, setServices] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBikeId, setSelectedBikeId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Deletion confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local add service modal
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [svcData, bikeData] = await Promise.all([
        apiFetch('/api/services'),
        apiFetch('/api/motorcycles'),
      ]);
      setServices(svcData);
      setBikes(bikeData);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to load services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/services/${deleteId}`, { method: 'DELETE' });
      success('Service record deleted successfully.');
      setServices((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to delete service record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      !search ||
      s.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase())) ||
      (s.partsReplaced && s.partsReplaced.toLowerCase().includes(search.toLowerCase())) ||
      `${s.motorcycle?.brand} ${s.motorcycle?.model}`.toLowerCase().includes(search.toLowerCase());

    const matchesBike =
      selectedBikeId === 'ALL' || s.motorcycleId === parseInt(selectedBikeId, 10);

    const matchesType =
      selectedType === 'ALL' || s.serviceType === selectedType;

    return matchesSearch && matchesBike && matchesType;
  });

  const totalCost = filtered.reduce((acc, s) => acc + parseFloat(s.cost || '0'), 0);

  if (isLoading) {
    return <LoadingSpinner label="Fetching garage service records..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Service Records ({services.length})
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Comprehensive maintenance log across all your motorcycles.
          </p>
        </div>

        <button
          onClick={() => (bikes.length > 0 ? setIsAddOpen(true) : onOpenAddService())}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/40 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Service Record</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search service type, parts, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedBikeId}
            onChange={(e) => setSelectedBikeId(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          >
            <option value="ALL">All Motorcycles</option>
            {bikes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand} {b.model} {b.nickname ? `(${b.nickname})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          >
            <option value="ALL">All Service Types</option>
            <option value="Oil Change">Oil Change</option>
            <option value="Engine Service">Engine Service</option>
            <option value="Brake Service">Brake Service</option>
            <option value="Chain & Sprocket">Chain & Sprocket</option>
            <option value="Tyre">Tyre</option>
            <option value="Battery">Battery</option>
            <option value="Electrical">Electrical</option>
            <option value="Suspension">Suspension</option>
            <option value="General Inspection">General Inspection</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>Showing {filtered.length} of {services.length} records</span>
        <span>Filtered Total: <strong className="text-zinc-200">Rs. {Math.round(totalCost).toLocaleString()}</strong></span>
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-3xl">
          <Wrench className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200 mb-1">
            No matching service records
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Try adjusting your search terms or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((svc) => (
            <div
              key={svc.id}
              className="p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl shadow transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-extrabold text-zinc-100">
                    {svc.serviceType}
                  </span>
                  <button
                    onClick={() => onNavigateToBike(svc.motorcycleId)}
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-rose-400 border border-zinc-700 flex items-center gap-1 transition"
                  >
                    <Bike className="w-3 h-3" />
                    <span>
                      {svc.motorcycle?.brand} {svc.motorcycle?.model}
                    </span>
                  </button>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {Number(svc.mileage).toLocaleString()} km
                  </span>
                </div>

                <div className="text-xs text-zinc-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {svc.serviceDate}
                  </span>
                  {svc.partsReplaced && (
                    <span>• Parts: <strong className="text-zinc-300">{svc.partsReplaced}</strong></span>
                  )}
                </div>

                {svc.notes && (
                  <p className="text-xs text-zinc-400 italic">
                    "{svc.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-850">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">
                    Total Cost
                  </span>
                  <span className="text-lg font-black text-zinc-100">
                    Rs. {Number(svc.cost).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => setDeleteId(svc.id)}
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

      {/* Add Service Modal */}
      {isAddOpen && (
        <AddServiceModal
          isOpen={true}
          motorcycles={bikes}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            setIsAddOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Service Record"
        message="Are you sure you want to delete this service record? This cannot be undone."
        confirmText="Delete Record"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
