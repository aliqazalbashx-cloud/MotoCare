import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { StatCard } from '../components/ui/StatCard.tsx';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import {
  Bike,
  Wrench,
  Receipt,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  onNavigateToBike: (bikeId: number) => void;
  onOpenAddBike: () => void;
  onOpenAddService: () => void;
  onOpenAddExpense: () => void;
  onSelectTab: (tab: any) => void;
}

const CATEGORY_COLORS = ['#f43f5e', '#f59e0b', '#38bdf8', '#10b981', '#a855f7', '#ec4899', '#71717a'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToBike,
  onOpenAddBike,
  onOpenAddService,
  onOpenAddExpense,
  onSelectTab,
}) => {
  const { apiFetch, user } = useAuth();

  const [summary, setSummary] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumData, anaData] = await Promise.all([
        apiFetch('/api/dashboard/summary'),
        apiFetch('/api/dashboard/analytics'),
      ]);
      setSummary(sumData);
      setAnalytics(anaData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Crunching garage data & maintenance metrics..." />;
  }

  if (!summary || summary.motorcycleCount === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              Welcome, {user?.name || 'Rider'}
            </h1>
            <p className="text-sm text-zinc-400">
              Your digital maintenance log and motorcycle telemetry HQ.
            </p>
          </div>
        </div>

        <EmptyState
          icon={Bike}
          title="Your garage is empty."
          description="Add your first motorcycle to start logging service records, tracking recurring maintenance, and monitoring spending."
          actionText="Add Your First Motorcycle"
          onAction={onOpenAddBike}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Garage HQ
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Fleet overview for {user?.name || 'Rider'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddService}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-rose-400" />
            <span>Log Service</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={onOpenAddBike}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md shadow-rose-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Motorcycle</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Motorcycles"
          value={summary.motorcycleCount}
          subtext="Active in your garage"
          icon={<Bike className="w-4 h-4" />}
          accentColor="red"
        />

        <StatCard
          label="Total Investment"
          value={`Rs. ${Math.round(summary.totalSpending).toLocaleString()}`}
          subtext={`Service: Rs. ${Math.round(summary.totalServiceSpend).toLocaleString()}`}
          icon={<Receipt className="w-4 h-4" />}
          accentColor="amber"
        />

        <StatCard
          label="Spent This Month"
          value={`Rs. ${Math.round(summary.thisMonthSpend).toLocaleString()}`}
          subtext={`This Year: Rs. ${Math.round(summary.thisYearSpend).toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
          accentColor="blue"
        />

        <StatCard
          label="Maintenance Health"
          value={`${summary.overallHealth}/100`}
          subtext="Based on scheduled intervals"
          icon={<Sparkles className="w-4 h-4" />}
          accentColor={summary.overallHealth >= 80 ? 'emerald' : summary.overallHealth >= 50 ? 'amber' : 'red'}
        />
      </div>

      {/* Maintenance Action Alerts */}
      {summary.scheduleAlerts && summary.scheduleAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Upcoming & Due Maintenance Alerts</span>
            </h2>
            <button
              onClick={() => onSelectTab('maintenance')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <span>View all schedules</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.scheduleAlerts.map((alert: any) => (
              <div
                key={`${alert.motorcycleId}-${alert.id}`}
                className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-300 truncate">
                      {alert.bikeName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${alert.badgeColor.bg} ${alert.badgeColor.text} ${alert.badgeColor.border}`}
                    >
                      {alert.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    {alert.type}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {alert.kmRemaining < 0
                      ? `Exceeded interval by ${Math.abs(alert.kmRemaining).toLocaleString()} km`
                      : alert.kmRemaining === 0
                      ? 'Due right now'
                      : `Due in ~${alert.kmRemaining.toLocaleString()} km`}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-850/60 flex items-center justify-between">
                  <button
                    onClick={() => onNavigateToBike(alert.motorcycleId)}
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    View Bike
                  </button>
                  <button
                    onClick={onOpenAddService}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Log Service</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Charts Row */}
      {analytics?.hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Monthly Spending Trend */}
          <div className="lg:col-span-8 p-5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Monthly Spending Trends
                </h3>
                <p className="text-xs text-zinc-400">
                  Services & operating costs over time
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrends}>
                  <XAxis
                    dataKey="month"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(val) => `Rs. ${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '0.75rem',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Total Spent']}
                  />
                  <Bar dataKey="total" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Category Breakdown */}
          <div className="lg:col-span-4 p-5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 mb-0.5">
                Spending by Category
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Allocation across maintenance & gear
              </p>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.categoryBreakdown.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.75rem',
                        color: '#fafafa',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-zinc-850">
              {analytics.categoryBreakdown.slice(0, 4).map((cat: any, idx: number) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                    <span className="text-zinc-300 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-200">
                    Rs. {Number(cat.value).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent History Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Services */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-zinc-100">
                Recent Service Records
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('services')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              View All
            </button>
          </div>

          {summary.recentServices?.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No service records logged yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-850">
              {summary.recentServices.map((service: any) => (
                <div key={service.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-200">
                      {service.serviceType}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {service.motorcycle?.brand} {service.motorcycle?.model} •{' '}
                      {Number(service.mileage).toLocaleString()} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-200">
                      Rs. {Number(service.cost).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-500">{service.serviceDate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-zinc-100">
                Recent Expenses
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('expenses')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300"
            >
              View All
            </button>
          </div>

          {summary.recentExpenses?.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No expenses recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-850">
              {summary.recentExpenses.map((expense: any) => (
                <div key={expense.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-200">
                      {expense.description}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {expense.category} • {expense.motorcycle?.brand} {expense.motorcycle?.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-200">
                      Rs. {Number(expense.amount).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-zinc-500">{expense.expenseDate}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
