import { z } from 'zod';

export function getValidationError(error: any): string {
  if (error?.issues && Array.isArray(error.issues) && error.issues.length > 0) {
    return error.issues[0]?.message || 'Invalid input data';
  }
  if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors[0]?.message || 'Invalid input data';
  }
  return error?.message || 'Invalid input data';
}

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  });

export const motorcycleSchema = z.object({
  brand: z.string().trim().min(1, 'Brand is required').max(50),
  model: z.string().trim().min(1, 'Model is required').max(50),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(2035, 'Year cannot be in distant future'),
  nickname: z.string().trim().max(50).optional().nullable(),
  registrationNumber: z.string().trim().max(30).optional().nullable(),
  currentMileage: z
    .number()
    .int()
    .min(0, 'Mileage cannot be negative'),
  purchaseDate: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const serviceRecordSchema = z.object({
  motorcycleId: z.number().int().positive('Valid motorcycle is required'),
  serviceType: z.string().trim().min(1, 'Service type is required'),
  serviceDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mileage: z
    .number()
    .int()
    .min(0, 'Mileage cannot be negative'),
  cost: z
    .number()
    .min(0, 'Cost cannot be negative'),
  partsReplaced: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const maintenanceScheduleSchema = z.object({
  motorcycleId: z.number().int().positive('Valid motorcycle is required'),
  maintenanceType: z.string().trim().min(1, 'Maintenance type is required'),
  intervalKm: z
    .number()
    .int()
    .positive('Interval must be greater than 0 km'),
  intervalDays: z
    .number()
    .int()
    .positive('Days interval must be positive')
    .optional()
    .nullable(),
  lastCompletedMileage: z
    .number()
    .int()
    .min(0, 'Mileage cannot be negative')
    .optional()
    .nullable(),
  lastCompletedDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional()
    .or(z.literal(''))
    .nullable(),
  isEnabled: z.boolean().default(true),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const expenseSchema = z.object({
  motorcycleId: z.number().int().positive('Valid motorcycle is required'),
  category: z.enum([
    'Maintenance',
    'Fuel',
    'Parts',
    'Accessories',
    'Insurance',
    'Registration',
    'Other',
  ]),
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  expenseDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description: z.string().trim().min(1, 'Description is required').max(200),
});
