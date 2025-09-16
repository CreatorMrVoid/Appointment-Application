import { Router } from 'express';
import { bloodType as BloodType } from '@prisma/client';
import prisma from '../utils/prisma';
import { requireAuth } from '../middlewares/auth'; // must set req.user.id

const router = Router();

/**
 * GET /health/me
 * Returns current user's health info or null if not set.
 */
router.get('/health/me', requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub as number;
  const health = await prisma.healthUser.findUnique({ where: { userId } });
  res.json({ health });
});

/**
 * PUT /health/me
 * Upserts current user's health info.
 * body: { age?: number, bloodType?: "A_POS"|..., height?: number, weight?: number }
 */
router.put('/health/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.sub as number;
    const { age, bloodType, height, weight } = req.body ?? {};

    // very light validation
    const clean: { age: number | null; bloodType: BloodType | null; height: number | null; weight: number | null } = {
      age: typeof age === 'number' && age >= 0 && age < 150 ? Math.floor(age) : null,
      bloodType: typeof bloodType === 'string' && (bloodType in BloodType) ? (bloodType as BloodType) : null,
      height: typeof height === 'number' && height >= 0 && height < 300 ? height : null,
      weight: typeof weight === 'number' && weight >= 0 && weight < 600 ? weight : null,
    };

    const item = await prisma.healthUser.upsert({
      where: { userId },
      create: { userId, ...clean },
      update: clean,
    });

    res.json({ health: item });
  } catch (e) {
    next(e);
  }
});

export default router;