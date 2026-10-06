import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  expenses,
  maintenanceSchedules,
  motorcycles,
  serviceRecords,
  users,
} from '../../db/schema.ts';

export const seedRouter = express.Router();
const JWT_SECRET = process.env.AUTH_SECRET || 'motorcare-jwt-secret-key-2026-production';

export async function seedDemoUserAndData() {
  const demoEmail = 'demo@motorcare.local';
  const demoPassword = 'password123';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Check if demo user already exists
  let demoUser = (
    await db.select().from(users).where(eq(users.email, demoEmail)).limit(1)
  )[0];

  if (!demoUser) {
    const insertedUser = await db
      .insert(users)
      .values({
        uid: 'demo_user_seed_motorcare',
        email: demoEmail,
        name: 'Demo Rider',
        passwordHash,
        avatarUrl: null,
      })
      .returning();
    demoUser = insertedUser[0];
  } else {
    // Ensure password is up to date
    await db
      .update(users)
      .set({ passwordHash, name: 'Demo Rider' })
      .where(eq(users.id, demoUser.id));
  }

  // Check if demo user has motorcycles
  const existingBikes = await db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.userId, demoUser.id));

  if (existingBikes.length === 0) {
    // 1. Motorcycle: Honda CB150F
    const honda = (
      await db
        .insert(motorcycles)
        .values({
          userId: demoUser.id,
          brand: 'Honda',
          model: 'CB150F',
          year: 2026,
          nickname: 'Red Comet',
          registrationNumber: 'ABC-123',
          currentMileage: 8500,
          purchaseDate: '2025-01-15',
          imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=60',
          notes: 'Daily commuter bike. Very reliable and fuel efficient.',
        })
        .returning()
    )[0];

    // Schedules for Honda
    await db.insert(maintenanceSchedules).values([
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        maintenanceType: 'Oil Change',
        intervalKm: 1000,
        intervalDays: 90,
        lastCompletedMileage: 8000,
        lastCompletedDate: '2026-09-01',
        isEnabled: true,
        notes: 'Full synthetic 10W-30 motorcycle oil',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        maintenanceType: 'Chain Service',
        intervalKm: 500,
        intervalDays: 30,
        lastCompletedMileage: 8200,
        lastCompletedDate: '2026-09-18',
        isEnabled: true,
        notes: 'Clean chain and apply heavy-duty wax lube',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        maintenanceType: 'Brake Inspection',
        intervalKm: 2000,
        intervalDays: 120,
        lastCompletedMileage: 7000,
        lastCompletedDate: '2026-06-15',
        isEnabled: true,
        notes: 'Inspect front disc and rear drum linings',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        maintenanceType: 'General Inspection',
        intervalKm: 3000,
        intervalDays: 180,
        lastCompletedMileage: 6000,
        lastCompletedDate: '2026-04-10',
        isEnabled: true,
        notes: 'Check all chassis fasteners and tyre pressures',
      },
    ]);

    // Service records for Honda
    await db.insert(serviceRecords).values([
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        serviceType: 'Oil Change',
        serviceDate: '2026-09-01',
        mileage: 8000,
        cost: '1800.00',
        partsReplaced: 'Engine Oil (1L Synthetic), Oil Strainer Cleaned',
        notes: 'Routine service at authorized Honda center',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        serviceType: 'Chain & Sprocket',
        serviceDate: '2026-08-14',
        mileage: 7500,
        cost: '1200.00',
        partsReplaced: 'Chain tensioned, link lubricated',
        notes: 'Adjusted slack to 25mm spec',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        serviceType: 'Brake Service',
        serviceDate: '2026-06-15',
        mileage: 7000,
        cost: '2200.00',
        partsReplaced: 'Front ceramic brake pads',
        notes: 'Brake fluid bled and refreshed',
      },
    ]);

    // Expenses for Honda
    await db.insert(expenses).values([
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        category: 'Accessories',
        amount: '4500.00',
        expenseDate: '2026-08-10',
        description: 'Crash guards and phone mount installed',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        category: 'Fuel',
        amount: '3200.00',
        expenseDate: '2026-09-22',
        description: 'Monthly commute high-octane petrol refill',
      },
      {
        motorcycleId: honda.id,
        userId: demoUser.id,
        category: 'Insurance',
        amount: '8500.00',
        expenseDate: '2026-01-20',
        description: 'Annual comprehensive third-party & theft insurance',
      },
    ]);

    // 2. Motorcycle: Yamaha MT-07
    const yamaha = (
      await db
        .insert(motorcycles)
        .values({
          userId: demoUser.id,
          brand: 'Yamaha',
          model: 'MT-07',
          year: 2025,
          nickname: 'Dark Side',
          registrationNumber: 'KHI-908',
          currentMileage: 14200,
          purchaseDate: '2024-03-20',
          imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=60',
          notes: 'Weekend twisties and highway touring roadster.',
        })
        .returning()
    )[0];

    // Schedules for Yamaha
    await db.insert(maintenanceSchedules).values([
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        maintenanceType: 'Oil Change',
        intervalKm: 5000,
        intervalDays: 180,
        lastCompletedMileage: 10000,
        lastCompletedDate: '2026-05-12',
        isEnabled: true,
        notes: 'Yamalube 10W-40 full synthetic and OEM filter',
      },
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        maintenanceType: 'Tyre Inspection',
        intervalKm: 3000,
        intervalDays: 90,
        lastCompletedMileage: 12000,
        lastCompletedDate: '2026-07-20',
        isEnabled: true,
        notes: 'Check Michelin Road 6 tread depth and pressures',
      },
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        maintenanceType: 'Battery Check',
        intervalKm: 5000,
        intervalDays: 120,
        lastCompletedMileage: 9500,
        lastCompletedDate: '2026-04-05',
        isEnabled: true,
        notes: 'Tender voltage test and terminal cleaning',
      },
    ]);

    // Service records for Yamaha
    await db.insert(serviceRecords).values([
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        serviceType: 'Engine Service',
        serviceDate: '2026-05-12',
        mileage: 10000,
        cost: '12500.00',
        partsReplaced: 'Oil, oil filter, spark plugs, air filter cleaned',
        notes: '10,000 km major service at Yamaha dealer',
      },
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        serviceType: 'Tyre',
        serviceDate: '2026-07-20',
        mileage: 12000,
        cost: '34000.00',
        partsReplaced: 'Rear Michelin Road 6 tyre (180/55-17)',
        notes: 'Replaced due to puncture wear, balanced wheel',
      },
    ]);

    // Expenses for Yamaha
    await db.insert(expenses).values([
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        category: 'Accessories',
        amount: '18500.00',
        expenseDate: '2026-03-10',
        description: 'Windscreen visor and tail tidy kit',
      },
      {
        motorcycleId: yamaha.id,
        userId: demoUser.id,
        category: 'Fuel',
        amount: '6800.00',
        expenseDate: '2026-09-15',
        description: 'Highway tour fuel refills',
      },
    ]);
  }

  const token = jwt.sign(
    { userId: demoUser.id, uid: demoUser.uid, email: demoUser.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    user: {
      id: demoUser.id,
      uid: demoUser.uid,
      email: demoUser.email,
      name: demoUser.name,
      avatarUrl: demoUser.avatarUrl,
    },
    token,
  };
}

seedRouter.post('/demo', async (_req, res) => {
  try {
    const result = await seedDemoUserAndData();
    return res.json({
      message: 'Demo user and sample garage data seeded successfully.',
      ...result,
    });
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    return res.status(500).json({ error: 'Failed to seed demo data.' });
  }
});
