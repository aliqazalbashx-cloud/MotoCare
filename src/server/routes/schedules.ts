import express from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { maintenanceSchedules, motorcycles } from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { maintenanceScheduleSchema, getValidationError } from '../../lib/validation.ts';
import { verifyMotorcycleOwnership } from '../db-operations.ts';
import { DEFAULT_MAINTENANCE_PRESETS } from '../../lib/calculations.ts';

export const schedulesRouter = express.Router();

/**
 * Get schedules for a specific motorcycle
 */
schedulesRouter.get('/motorcycle/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const motorcycleId = parseInt(req.params.id, 10);
    if (isNaN(motorcycleId)) {
      return res.status(400).json({ error: 'Invalid motorcycle ID' });
    }

    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const schedules = await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.motorcycleId, motorcycleId))
      .orderBy(maintenanceSchedules.intervalKm);

    return res.json(schedules);
  } catch (error) {
    console.error('Failed to get schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

/**
 * Create a new maintenance schedule
 */
schedulesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const parseResult = maintenanceScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const {
      motorcycleId,
      maintenanceType,
      intervalKm,
      intervalDays,
      lastCompletedMileage,
      lastCompletedDate,
      isEnabled,
      notes,
    } = parseResult.data;

    // Verify motorcycle ownership
    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const inserted = await db
      .insert(maintenanceSchedules)
      .values({
        motorcycleId,
        userId,
        maintenanceType,
        intervalKm,
        intervalDays: intervalDays || null,
        lastCompletedMileage: lastCompletedMileage ?? bike.currentMileage,
        lastCompletedDate: lastCompletedDate || null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        notes: notes || null,
      })
      .returning();

    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return res.status(500).json({ error: 'Failed to create schedule' });
  }
});

/**
 * Update an existing maintenance schedule
 */
schedulesRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const existing = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or access denied.' });
    }

    const parseResult = maintenanceScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const {
      maintenanceType,
      intervalKm,
      intervalDays,
      lastCompletedMileage,
      lastCompletedDate,
      isEnabled,
      notes,
    } = parseResult.data;

    const updated = await db
      .update(maintenanceSchedules)
      .set({
        maintenanceType,
        intervalKm,
        intervalDays: intervalDays || null,
        lastCompletedMileage: lastCompletedMileage ?? 0,
        lastCompletedDate: lastCompletedDate || null,
        isEnabled,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      )
      .returning();

    return res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
});

/**
 * Toggle schedule enabled status
 */
schedulesRouter.patch('/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const existing = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or access denied.' });
    }

    const updated = await db
      .update(maintenanceSchedules)
      .set({
        isEnabled: !existing[0].isEnabled,
        updatedAt: new Date(),
      })
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      )
      .returning();

    return res.json(updated[0]);
  } catch (error) {
    console.error('Failed to toggle schedule:', error);
    return res.status(500).json({ error: 'Failed to toggle schedule' });
  }
});

/**
 * Delete a maintenance schedule
 */
schedulesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const scheduleId = parseInt(req.params.id, 10);
    if (isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Invalid schedule ID' });
    }

    const existing = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Schedule not found or access denied.' });
    }

    await db
      .delete(maintenanceSchedules)
      .where(
        and(eq(maintenanceSchedules.id, scheduleId), eq(maintenanceSchedules.userId, userId))
      );

    return res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

/**
 * Reset / Seed default recommended schedules for a motorcycle
 */
schedulesRouter.post('/motorcycle/:id/reset-defaults', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const motorcycleId = parseInt(req.params.id, 10);
    if (isNaN(motorcycleId)) {
      return res.status(400).json({ error: 'Invalid motorcycle ID' });
    }

    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const inserts = DEFAULT_MAINTENANCE_PRESETS.map((p) => ({
      motorcycleId,
      userId,
      maintenanceType: p.type,
      intervalKm: p.intervalKm,
      intervalDays: p.intervalDays,
      lastCompletedMileage: bike.currentMileage,
      lastCompletedDate: todayStr,
      isEnabled: true,
      notes: p.notes,
    }));

    const result = await db.insert(maintenanceSchedules).values(inserts).returning();
    return res.status(201).json(result);
  } catch (error) {
    console.error('Failed to add default schedules:', error);
    return res.status(500).json({ error: 'Failed to add default schedules' });
  }
});
