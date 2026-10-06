import express from 'express';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  maintenanceSchedules,
  motorcycles,
  serviceRecords,
} from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { serviceRecordSchema, getValidationError } from '../../lib/validation.ts';
import { verifyMotorcycleOwnership } from '../db-operations.ts';

export const servicesRouter = express.Router();

/**
 * List all service records for the current user (with optional filters)
 */
servicesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { motorcycleId, serviceType, search } = req.query;

    const query = db
      .select({
        service: serviceRecords,
        motorcycle: {
          id: motorcycles.id,
          brand: motorcycles.brand,
          model: motorcycles.model,
          year: motorcycles.year,
          nickname: motorcycles.nickname,
        },
      })
      .from(serviceRecords)
      .innerJoin(motorcycles, eq(serviceRecords.motorcycleId, motorcycles.id))
      .where(eq(serviceRecords.userId, userId))
      .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.id));

    const allServices = await query;

    // In-memory or refined filter
    let filtered = allServices;
    if (motorcycleId) {
      const bikeId = parseInt(motorcycleId as string, 10);
      filtered = filtered.filter((s) => s.service.motorcycleId === bikeId);
    }
    if (serviceType) {
      filtered = filtered.filter(
        (s) => s.service.serviceType.toLowerCase() === (serviceType as string).toLowerCase()
      );
    }
    if (search) {
      const searchStr = (search as string).toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.service.serviceType.toLowerCase().includes(searchStr) ||
          (s.service.notes && s.service.notes.toLowerCase().includes(searchStr)) ||
          (s.service.partsReplaced && s.service.partsReplaced.toLowerCase().includes(searchStr)) ||
          `${s.motorcycle.brand} ${s.motorcycle.model}`.toLowerCase().includes(searchStr)
      );
    }

    return res.json(
      filtered.map((item) => ({
        ...item.service,
        motorcycle: item.motorcycle,
      }))
    );
  } catch (error) {
    console.error('Failed to get service records:', error);
    return res.status(500).json({ error: 'Failed to fetch service records' });
  }
});

/**
 * Create a new service record
 */
servicesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const parseResult = serviceRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { motorcycleId, serviceType, serviceDate, mileage, cost, partsReplaced, notes } =
      parseResult.data;

    // Verify motorcycle ownership
    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const inserted = await db
      .insert(serviceRecords)
      .values({
        motorcycleId,
        userId,
        serviceType,
        serviceDate,
        mileage,
        cost: cost.toString(),
        partsReplaced: partsReplaced || null,
        notes: notes || null,
      })
      .returning();

    const newRecord = inserted[0];

    // If recorded service mileage is higher than motorcycle's current mileage, update odometer
    if (mileage > bike.currentMileage) {
      await db
        .update(motorcycles)
        .set({ currentMileage: mileage, updatedAt: new Date() })
        .where(eq(motorcycles.id, motorcycleId));
    }

    // Auto-update any matching maintenance schedule
    const matchingSchedules = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.motorcycleId, motorcycleId),
          ilike(maintenanceSchedules.maintenanceType, serviceType)
        )
      );

    if (matchingSchedules.length > 0) {
      for (const sched of matchingSchedules) {
        if (!sched.lastCompletedMileage || mileage >= sched.lastCompletedMileage) {
          await db
            .update(maintenanceSchedules)
            .set({
              lastCompletedMileage: mileage,
              lastCompletedDate: serviceDate,
              updatedAt: new Date(),
            })
            .where(eq(maintenanceSchedules.id, sched.id));
        }
      }
    }

    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('Failed to create service record:', error);
    return res.status(500).json({ error: 'Failed to create service record' });
  }
});

/**
 * Update an existing service record
 */
servicesRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    // Check ownership of service record
    const existing = await db
      .select()
      .from(serviceRecords)
      .where(and(eq(serviceRecords.id, serviceId), eq(serviceRecords.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service record not found or access denied.' });
    }

    const parseResult = serviceRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { serviceType, serviceDate, mileage, cost, partsReplaced, notes } = parseResult.data;

    const updated = await db
      .update(serviceRecords)
      .set({
        serviceType,
        serviceDate,
        mileage,
        cost: cost.toString(),
        partsReplaced: partsReplaced || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(serviceRecords.id, serviceId), eq(serviceRecords.userId, userId)))
      .returning();

    return res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update service record:', error);
    return res.status(500).json({ error: 'Failed to update service record' });
  }
});

/**
 * Delete a service record
 */
servicesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const serviceId = parseInt(req.params.id, 10);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const existing = await db
      .select()
      .from(serviceRecords)
      .where(and(eq(serviceRecords.id, serviceId), eq(serviceRecords.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Service record not found or access denied.' });
    }

    await db
      .delete(serviceRecords)
      .where(and(eq(serviceRecords.id, serviceId), eq(serviceRecords.userId, userId)));

    return res.json({ message: 'Service record deleted successfully' });
  } catch (error) {
    console.error('Failed to delete service record:', error);
    return res.status(500).json({ error: 'Failed to delete service record' });
  }
});
