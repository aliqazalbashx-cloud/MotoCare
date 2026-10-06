import { relations } from 'drizzle-orm';
import { boolean, index, integer, numeric, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID or generated UID
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    passwordHash: text('password_hash'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_uid_idx').on(table.uid),
  ]
);

export const motorcycles = pgTable(
  'motorcycles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    nickname: text('nickname'),
    registrationNumber: text('registration_number'),
    currentMileage: integer('current_mileage').notNull().default(0),
    purchaseDate: text('purchase_date'),
    imageUrl: text('image_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('motorcycles_user_id_idx').on(table.userId),
  ]
);

export const serviceRecords = pgTable(
  'service_records',
  {
    id: serial('id').primaryKey(),
    motorcycleId: integer('motorcycle_id')
      .references(() => motorcycles.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    serviceType: text('service_type').notNull(),
    serviceDate: text('service_date').notNull(),
    mileage: integer('mileage').notNull(),
    cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
    partsReplaced: text('parts_replaced'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('service_records_motorcycle_id_idx').on(table.motorcycleId),
    index('service_records_user_id_idx').on(table.userId),
    index('service_records_date_idx').on(table.serviceDate),
  ]
);

export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
    id: serial('id').primaryKey(),
    motorcycleId: integer('motorcycle_id')
      .references(() => motorcycles.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    maintenanceType: text('maintenance_type').notNull(),
    intervalKm: integer('interval_km').notNull(),
    intervalDays: integer('interval_days'),
    lastCompletedMileage: integer('last_completed_mileage').default(0),
    lastCompletedDate: text('last_completed_date'),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('schedules_motorcycle_id_idx').on(table.motorcycleId),
    index('schedules_user_id_idx').on(table.userId),
  ]
);

export const expenses = pgTable(
  'expenses',
  {
    id: serial('id').primaryKey(),
    motorcycleId: integer('motorcycle_id')
      .references(() => motorcycles.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    category: text('category').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    expenseDate: text('expense_date').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('expenses_motorcycle_id_idx').on(table.motorcycleId),
    index('expenses_user_id_idx').on(table.userId),
    index('expenses_date_idx').on(table.expenseDate),
  ]
);

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  motorcycles: many(motorcycles),
  serviceRecords: many(serviceRecords),
  maintenanceSchedules: many(maintenanceSchedules),
  expenses: many(expenses),
}));

export const motorcyclesRelations = relations(motorcycles, ({ one, many }) => ({
  owner: one(users, {
    fields: [motorcycles.userId],
    references: [users.id],
  }),
  serviceRecords: many(serviceRecords),
  maintenanceSchedules: many(maintenanceSchedules),
  expenses: many(expenses),
}));

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  motorcycle: one(motorcycles, {
    fields: [serviceRecords.motorcycleId],
    references: [motorcycles.id],
  }),
  user: one(users, {
    fields: [serviceRecords.userId],
    references: [users.id],
  }),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one }) => ({
  motorcycle: one(motorcycles, {
    fields: [maintenanceSchedules.motorcycleId],
    references: [motorcycles.id],
  }),
  user: one(users, {
    fields: [maintenanceSchedules.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  motorcycle: one(motorcycles, {
    fields: [expenses.motorcycleId],
    references: [motorcycles.id],
  }),
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));
