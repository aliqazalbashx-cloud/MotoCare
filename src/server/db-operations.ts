import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  expenses,
  maintenanceSchedules,
  motorcycles,
  serviceRecords,
  users,
} from '../db/schema.ts';

/**
 * Ensures the given motorcycle belongs to the authenticated user.
 */
export async function verifyMotorcycleOwnership(motorcycleId: number, userId: number) {
  const result = await db
    .select()
    .from(motorcycles)
    .where(and(eq(motorcycles.id, motorcycleId), eq(motorcycles.userId, userId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all motorcycles belonging to a user with calculated summaries.
 */
export async function getUserMotorcycles(userId: number) {
  const userBikes = await db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.userId, userId))
    .orderBy(desc(motorcycles.createdAt));

  const bikesWithDetails = await Promise.all(
    userBikes.map(async (bike) => {
      // Last service
      const lastService = await db
        .select()
        .from(serviceRecords)
        .where(eq(serviceRecords.motorcycleId, bike.id))
        .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.id))
        .limit(1);

      // Total service spend
      const serviceSpend = await db
        .select({
          total: sql<string>`coalesce(sum(${serviceRecords.cost}), 0)`,
        })
        .from(serviceRecords)
        .where(eq(serviceRecords.motorcycleId, bike.id));

      // Total expenses spend
      const expenseSpend = await db
        .select({
          total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.motorcycleId, bike.id));

      // Active schedules
      const schedules = await db
        .select()
        .from(maintenanceSchedules)
        .where(
          and(
            eq(maintenanceSchedules.motorcycleId, bike.id),
            eq(maintenanceSchedules.isEnabled, true)
          )
        );

      const totalSpent =
        parseFloat(serviceSpend[0]?.total || '0') +
        parseFloat(expenseSpend[0]?.total || '0');

      return {
        ...bike,
        lastService: lastService[0] || null,
        totalSpent,
        scheduleCount: schedules.length,
        schedules,
      };
    })
  );

  return bikesWithDetails;
}

/**
 * Get a single motorcycle with all relations for its detailed dashboard.
 */
export async function getMotorcycleDetails(motorcycleId: number, userId: number) {
  const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
  if (!bike) return null;

  const services = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.motorcycleId, motorcycleId))
    .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.id));

  const schedules = await db
    .select()
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.motorcycleId, motorcycleId))
    .orderBy(desc(maintenanceSchedules.isEnabled), maintenanceSchedules.intervalKm);

  const bikeExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.motorcycleId, motorcycleId))
    .orderBy(desc(expenses.expenseDate), desc(expenses.id));

  const serviceTotal = services.reduce((acc, s) => acc + parseFloat(s.cost || '0'), 0);
  const expenseTotal = bikeExpenses.reduce((acc, e) => acc + parseFloat(e.amount || '0'), 0);

  return {
    ...bike,
    services,
    schedules,
    expenses: bikeExpenses,
    totals: {
      serviceSpend: serviceTotal,
      otherSpend: expenseTotal,
      totalSpend: serviceTotal + expenseTotal,
      serviceCount: services.length,
      expenseCount: bikeExpenses.length,
    },
  };
}
