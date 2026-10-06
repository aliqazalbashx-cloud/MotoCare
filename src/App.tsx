/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar, NavTab } from './components/layout/Navbar.tsx';
import { LoadingSpinner } from './components/ui/LoadingSpinner.tsx';
import { LandingAndAuthView } from './views/LandingAndAuthView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { GarageView } from './views/GarageView.tsx';
import { MotorcycleDetailView } from './views/MotorcycleDetailView.tsx';
import { AllServicesView } from './views/AllServicesView.tsx';
import { AllMaintenanceView } from './views/AllMaintenanceView.tsx';
import { AllExpensesView } from './views/AllExpensesView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { AddMotorcycleModal } from './components/motorcycles/AddMotorcycleModal.tsx';
import { AddServiceModal } from './components/services/AddServiceModal.tsx';
import { AddExpenseModal } from './components/expenses/AddExpenseModal.tsx';

function MainAppShell() {
  const { user, isLoading, apiFetch } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab | 'bike_detail'>('dashboard');
  const [selectedBikeId, setSelectedBikeId] = useState<number | null>(null);

  // Global Modals
  const [isAddBikeOpen, setIsAddBikeOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [modalDefaultBikeId, setModalDefaultBikeId] = useState<number | undefined>(undefined);

  // Cached motorcycles list for global modals
  const [cachedBikes, setCachedBikes] = useState<any[]>([]);

  const refreshBikes = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/motorcycles');
      setCachedBikes(data);
    } catch (_err) {}
  };

  useEffect(() => {
    if (user) {
      refreshBikes();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner label="Starting MotorCare telemetry systems..." />
      </div>
    );
  }

  if (!user) {
    return <LandingAndAuthView />;
  }

  const handleNavigateToBike = (bikeId: number) => {
    setSelectedBikeId(bikeId);
    setCurrentTab('bike_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddServiceWithBike = (bikeId?: number) => {
    setModalDefaultBikeId(bikeId);
    setIsAddServiceOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row selection:bg-rose-500 selection:text-white">
      {/* Sidebar on desktop, top/drawer on mobile */}
      <Navbar
        currentTab={currentTab === 'bike_detail' ? 'motorcycles' : currentTab}
        onSelectTab={(tab) => {
          setSelectedBikeId(null);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddBike={() => setIsAddBikeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigateToBike={handleNavigateToBike}
            onOpenAddBike={() => setIsAddBikeOpen(true)}
            onOpenAddService={() => handleOpenAddServiceWithBike()}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'motorcycles' && (
          <GarageView
            onNavigateToBike={handleNavigateToBike}
            onOpenAddBike={() => setIsAddBikeOpen(true)}
            onOpenAddServiceForBike={(bikeId) => handleOpenAddServiceWithBike(bikeId)}
          />
        )}

        {currentTab === 'bike_detail' && selectedBikeId && (
          <MotorcycleDetailView
            motorcycleId={selectedBikeId}
            onBack={() => {
              setCurrentTab('motorcycles');
              setSelectedBikeId(null);
            }}
          />
        )}

        {currentTab === 'services' && (
          <AllServicesView
            onNavigateToBike={handleNavigateToBike}
            onOpenAddService={() => handleOpenAddServiceWithBike()}
          />
        )}

        {currentTab === 'maintenance' && (
          <AllMaintenanceView
            onNavigateToBike={handleNavigateToBike}
            onOpenAddSchedule={() => {
              if (cachedBikes.length > 0) {
                handleNavigateToBike(cachedBikes[0].id);
              } else {
                setIsAddBikeOpen(true);
              }
            }}
            onOpenAddServiceForBike={(bikeId) => handleOpenAddServiceWithBike(bikeId)}
          />
        )}

        {currentTab === 'expenses' && (
          <AllExpensesView
            onNavigateToBike={handleNavigateToBike}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          />
        )}

        {currentTab === 'profile' && <ProfileView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Add Motorcycle Modal */}
      {isAddBikeOpen && (
        <AddMotorcycleModal
          isOpen={true}
          onClose={() => setIsAddBikeOpen(false)}
          onSuccess={(_newBike) => {
            refreshBikes();
            setCurrentTab('motorcycles');
          }}
        />
      )}

      {/* Global Add Service Modal */}
      {isAddServiceOpen && (
        <AddServiceModal
          isOpen={true}
          motorcycles={cachedBikes}
          defaultMotorcycleId={modalDefaultBikeId}
          onClose={() => {
            setIsAddServiceOpen(false);
            setModalDefaultBikeId(undefined);
          }}
          onSuccess={() => {
            refreshBikes();
          }}
        />
      )}

      {/* Global Add Expense Modal */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={true}
          motorcycles={cachedBikes}
          onClose={() => setIsAddExpenseOpen(false)}
          onSuccess={() => {
            refreshBikes();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppShell />
      </AuthProvider>
    </ToastProvider>
  );
}

