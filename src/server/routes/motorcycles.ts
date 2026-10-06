import express from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { maintenanceSchedules, motorcycles } from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { motorcycleSchema, getValidationError } from '../../lib/validation.ts';
import {
  getUserMotorcycles,
  getMotorcycleDetails,
  verifyMotorcycleOwnership,
} from '../db-operations.ts';
import { DEFAULT_MAINTENANCE_PRESETS } from '../../lib/calculations.ts';

export const motorcyclesRouter = express.Router();

/**
 * List all motorcycles for current user
 */
motorcyclesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const bikes = await getUserMotorcycles(userId);
    return res.json(bikes);
  } catch (error) {
    console.error('Failed to get motorcycles:', error);
    return res.status(500).json({ error: 'Failed to fetch motorcycles' });
  }
});

/**
 * Get single motorcycle with full details (services, schedules, expenses)
 */
motorcyclesRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const motorcycleId = parseInt(req.params.id, 10);
    if (isNaN(motorcycleId)) {
      return res.status(400).json({ error: 'Invalid motorcycle ID' });
    }

    const details = await getMotorcycleDetails(motorcycleId, userId);
    if (!details) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    return res.json(details);
  } catch (error) {
    console.error('Failed to get motorcycle details:', error);
    return res.status(500).json({ error: 'Failed to fetch motorcycle details' });
  }
});

/**
 * Create a new motorcycle
 */
motorcyclesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { createDefaultSchedules, ...bodyData } = req.body;

    const parseResult = motorcycleSchema.safeParse(bodyData);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const bikeData = parseResult.data;

    const inserted = await db
      .insert(motorcycles)
      .values({
        userId,
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        nickname: bikeData.nickname || null,
        registrationNumber: bikeData.registrationNumber || null,
        currentMileage: bikeData.currentMileage,
        purchaseDate: bikeData.purchaseDate || null,
        imageUrl: bikeData.imageUrl || null,
        notes: bikeData.notes || null,
      })
      .returning();

    const newBike = inserted[0];

    // Optionally seed default maintenance schedules for convenience
    if (createDefaultSchedules !== false) {
      const todayStr = new Date().toISOString().split('T')[0];
      const scheduleInserts = DEFAULT_MAINTENANCE_PRESETS.map((preset) => ({
        motorcycleId: newBike.id,
        userId,
        maintenanceType: preset.type,
        intervalKm: preset.intervalKm,
        intervalDays: preset.intervalDays,
        lastCompletedMileage: newBike.currentMileage,
        lastCompletedDate: todayStr,
        isEnabled: true,
        notes: preset.notes,
      }));

      await db.insert(maintenanceSchedules).values(scheduleInserts);
    }

    return res.status(201).json(newBike);
  } catch (error) {
    console.error('Failed to create motorcycle:', error);
    return res.status(500).json({ error: 'Failed to create motorcycle' });
  }
});

/**
 * Update an existing motorcycle
 */
motorcyclesRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const motorcycleId = parseInt(req.params.id, 10);
    if (isNaN(motorcycleId)) {
      return res.status(400).json({ error: 'Invalid motorcycle ID' });
    }

    // Check ownership
    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const parseResult = motorcycleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const bikeData = parseResult.data;

    const updated = await db
      .update(motorcycles)
      .set({
        brand: bikeData.brand,
        model: bikeData.model,
        year: bikeData.year,
        nickname: bikeData.nickname || null,
        registrationNumber: bikeData.registrationNumber || null,
        currentMileage: bikeData.currentMileage,
        purchaseDate: bikeData.purchaseDate || null,
        imageUrl: bikeData.imageUrl || null,
        notes: bikeData.notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(motorcycles.id, motorcycleId), eq(motorcycles.userId, userId)))
      .returning();

    return res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update motorcycle:', error);
    return res.status(500).json({ error: 'Failed to update motorcycle' });
  }
});

/**
 * Delete a motorcycle (cascading deletes related services, schedules, and expenses)
 */
motorcyclesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
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

    await db
      .delete(motorcycles)
      .where(and(eq(motorcycles.id, motorcycleId), eq(motorcycles.userId, userId)));

    return res.json({ message: 'Motorcycle deleted successfully' });
  } catch (error) {
    console.error('Failed to delete motorcycle:', error);
    return res.status(500).json({ error: 'Failed to delete motorcycle' });
  }
});
