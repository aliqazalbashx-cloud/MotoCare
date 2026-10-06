import express from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { expenses, motorcycles } from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { expenseSchema, getValidationError } from '../../lib/validation.ts';
import { verifyMotorcycleOwnership } from '../db-operations.ts';

export const expensesRouter = express.Router();

/**
 * List all expenses for current user with optional filters
 */
expensesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { motorcycleId, category, search } = req.query;

    const allExpenses = await db
      .select({
        expense: expenses,
        motorcycle: {
          id: motorcycles.id,
          brand: motorcycles.brand,
          model: motorcycles.model,
          year: motorcycles.year,
          nickname: motorcycles.nickname,
        },
      })
      .from(expenses)
      .innerJoin(motorcycles, eq(expenses.motorcycleId, motorcycles.id))
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.expenseDate), desc(expenses.id));

    let filtered = allExpenses;
    if (motorcycleId) {
      const bikeId = parseInt(motorcycleId as string, 10);
      filtered = filtered.filter((e) => e.expense.motorcycleId === bikeId);
    }
    if (category) {
      filtered = filtered.filter(
        (e) => e.expense.category.toLowerCase() === (category as string).toLowerCase()
      );
    }
    if (search) {
      const searchStr = (search as string).toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.expense.description.toLowerCase().includes(searchStr) ||
          e.expense.category.toLowerCase().includes(searchStr) ||
          `${e.motorcycle.brand} ${e.motorcycle.model}`.toLowerCase().includes(searchStr)
      );
    }

    return res.json(
      filtered.map((item) => ({
        ...item.expense,
        motorcycle: item.motorcycle,
      }))
    );
  } catch (error) {
    console.error('Failed to get expenses:', error);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * Create a new expense
 */
expensesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const parseResult = expenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { motorcycleId, category, amount, expenseDate, description } = parseResult.data;

    // Verify motorcycle ownership
    const bike = await verifyMotorcycleOwnership(motorcycleId, userId);
    if (!bike) {
      return res.status(404).json({ error: 'Motorcycle not found or access denied.' });
    }

    const inserted = await db
      .insert(expenses)
      .values({
        motorcycleId,
        userId,
        category,
        amount: amount.toString(),
        expenseDate,
        description,
      })
      .returning();

    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Failed to create expense:', error);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
});

/**
 * Update an existing expense
 */
expensesRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id, 10);
    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expense not found or access denied.' });
    }

    const parseResult = expenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { category, amount, expenseDate, description } = parseResult.data;

    const updated = await db
      .update(expenses)
      .set({
        category,
        amount: amount.toString(),
        expenseDate,
        description,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .returning();

    return res.json(updated[0]);
  } catch (error) {
    console.error('Failed to update expense:', error);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
});

/**
 * Delete an expense
 */
expensesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const expenseId = parseInt(req.params.id, 10);
    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID' });
    }

    const existing = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expense not found or access denied.' });
    }

    await db
      .delete(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));

    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
});
