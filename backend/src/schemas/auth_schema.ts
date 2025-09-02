// Request validation (Zod)

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const digits = val.replace(/\D/g, "");
      return digits.slice(0, 20) || undefined;
    }),
  ssn: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const digits = val.replace(/\D/g, "");
      return digits.slice(0, 11) || undefined;
    }),
  usertype: z.string().optional() // default handled in service
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
