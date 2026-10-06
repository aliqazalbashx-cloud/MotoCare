import express from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  expenses,
  maintenanceSchedules,
  motorcycles,
  serviceRecords,
} from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { calculateHealthScore, calculateScheduleStatus } from '../../lib/calculations.ts';

export const dashboardRouter = express.Router();

dashboardRouter.get('/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Motorcycles
    const userBikes = await db
      .select()
      .from(motorcycles)
      .where(eq(motorcycles.userId, userId))
      .orderBy(desc(motorcycles.createdAt));

    // Services
    const userServices = await db
      .select({
        service: serviceRecords,
        motorcycle: {
          brand: motorcycles.brand,
          model: motorcycles.model,
          nickname: motorcycles.nickname,
        },
      })
      .from(serviceRecords)
      .innerJoin(motorcycles, eq(serviceRecords.motorcycleId, motorcycles.id))
      .where(eq(serviceRecords.userId, userId))
      .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.id));

    // Expenses
    const userExpenses = await db
      .select({
        expense: expenses,
        motorcycle: {
          brand: motorcycles.brand,
          model: motorcycles.model,
          nickname: motorcycles.nickname,
        },
      })
      .from(expenses)
      .innerJoin(motorcycles, eq(expenses.motorcycleId, motorcycles.id))
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.expenseDate), desc(expenses.id));

    // Schedules
    const allSchedules = await db
      .select({
        schedule: maintenanceSchedules,
        bikeMileage: motorcycles.currentMileage,
        bikeName: sql<string>`concat(${motorcycles.brand}, ' ', ${motorcycles.model})`,
        motorcycleId: motorcycles.id,
      })
      .from(maintenanceSchedules)
      .innerJoin(motorcycles, eq(maintenanceSchedules.motorcycleId, motorcycles.id))
      .where(
        and(
          eq(maintenanceSchedules.userId, userId),
          eq(maintenanceSchedules.isEnabled, true)
        )
      );

    // Compute status counts
    let overdueCount = 0;
    let dueSoonCount = 0;
    let dueCount = 0;
    const scheduleAlerts: any[] = [];

    allSchedules.forEach((item) => {
      const calc = calculateScheduleStatus(
        item.bikeMileage,
        item.schedule.intervalKm,
        item.schedule.lastCompletedMileage ?? 0,
        item.schedule.intervalDays,
        item.schedule.lastCompletedDate
      );

      if (calc.status === 'overdue') {
        overdueCount++;
        scheduleAlerts.push({
          id: item.schedule.id,
          motorcycleId: item.motorcycleId,
          bikeName: item.bikeName,
          type: item.schedule.maintenanceType,
          status: calc.status,
          label: calc.statusLabel,
          kmRemaining: calc.kmRemaining,
          badgeColor: calc.badgeColor,
        });
      } else if (calc.status === 'due') {
        dueCount++;
        scheduleAlerts.push({
          id: item.schedule.id,
          motorcycleId: item.motorcycleId,
          bikeName: item.bikeName,
          type: item.schedule.maintenanceType,
          status: calc.status,
          label: calc.statusLabel,
          kmRemaining: calc.kmRemaining,
          badgeColor: calc.badgeColor,
        });
      } else if (calc.status === 'due-soon') {
        dueSoonCount++;
        scheduleAlerts.push({
          id: item.schedule.id,
          motorcycleId: item.motorcycleId,
          bikeName: item.bikeName,
          type: item.schedule.maintenanceType,
          status: calc.status,
          label: calc.statusLabel,
          kmRemaining: calc.kmRemaining,
          badgeColor: calc.badgeColor,
        });
      }
    });

    // Spending calculations
    const now = new Date();
    const currentYearStr = `${now.getFullYear()}`;
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalServiceSpend = 0;
    let totalOtherSpend = 0;
    let thisMonthSpend = 0;
    let thisYearSpend = 0;

    userServices.forEach((s) => {
      const cost = parseFloat(s.service.cost || '0');
      totalServiceSpend += cost;
      if (s.service.serviceDate.startsWith(currentMonthStr)) {
        thisMonthSpend += cost;
      }
      if (s.service.serviceDate.startsWith(currentYearStr)) {
        thisYearSpend += cost;
      }
    });

    userExpenses.forEach((e) => {
      const amt = parseFloat(e.expense.amount || '0');
      totalOtherSpend += amt;
      if (e.expense.expenseDate.startsWith(currentMonthStr)) {
        thisMonthSpend += amt;
      }
      if (e.expense.expenseDate.startsWith(currentYearStr)) {
        thisYearSpend += amt;
      }
    });

    const totalSpending = totalServiceSpend + totalOtherSpend;

    // Garage overall health score
    let overallHealth = 100;
    if (userBikes.length > 0) {
      const bikeScores = userBikes.map((bike) => {
        const bikeScheds = allSchedules
          .filter((s) => s.motorcycleId === bike.id)
          .map((s) => s.schedule);
        return calculateHealthScore(bikeScheds, bike.currentMileage).score;
      });
      overallHealth = Math.round(
        bikeScores.reduce((acc, score) => acc + score, 0) / userBikes.length
      );
    }

    return res.json({
      motorcycleCount: userBikes.length,
      totalSpending,
      totalServiceSpend,
      totalOtherSpend,
      thisMonthSpend,
      thisYearSpend,
      overdueCount,
      dueSoonCount,
      dueCount,
      overallHealth,
      recentServices: userServices.slice(0, 5).map((s) => ({
        ...s.service,
        motorcycle: s.motorcycle,
      })),
      recentExpenses: userExpenses.slice(0, 5).map((e) => ({
        ...e.expense,
        motorcycle: e.motorcycle,
      })),
      scheduleAlerts: scheduleAlerts.slice(0, 6),
    });
  } catch (error) {
    console.error('Failed to get dashboard summary:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

/**
 * Analytics endpoints for charts (monthly spending, category breakdown)
 */
dashboardRouter.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const userServices = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.userId, userId));

    const userExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId));

    // Category breakdown
    const categoryTotals: Record<string, number> = {
      Maintenance: 0,
      Fuel: 0,
      Parts: 0,
      Accessories: 0,
      Insurance: 0,
      Registration: 0,
      Other: 0,
    };

    userServices.forEach((s) => {
      const cost = parseFloat(s.cost || '0');
      categoryTotals.Maintenance += cost;
    });

    userExpenses.forEach((e) => {
      const amt = parseFloat(e.amount || '0');
      if (categoryTotals[e.category] !== undefined) {
        categoryTotals[e.category] += amt;
      } else {
        categoryTotals.Other += amt;
      }
    });

    const categoryData = Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }));

    // Monthly breakdown (last 6 months)
    const monthlyDataMap: Record<string, { month: string; services: number; expenses: number; total: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyDataMap[key] = {
        month: label,
        services: 0,
        expenses: 0,
        total: 0,
      };
    }

    userServices.forEach((s) => {
      const key = s.serviceDate.substring(0, 7);
      if (monthlyDataMap[key]) {
        const cost = parseFloat(s.cost || '0');
        monthlyDataMap[key].services += cost;
        monthlyDataMap[key].total += cost;
      }
    });

    userExpenses.forEach((e) => {
      const key = e.expenseDate.substring(0, 7);
      if (monthlyDataMap[key]) {
        const amt = parseFloat(e.amount || '0');
        monthlyDataMap[key].expenses += amt;
        monthlyDataMap[key].total += amt;
      }
    });

    const monthlyTrends = Object.values(monthlyDataMap);

    return res.json({
      categoryBreakdown: categoryData,
      monthlyTrends,
      hasData: categoryData.length > 0 || monthlyTrends.some((m) => m.total > 0),
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
