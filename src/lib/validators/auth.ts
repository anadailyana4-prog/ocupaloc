import { z } from "zod";

export const slugSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9-]+$/, "Doar litere mici, cifre și cratimă");

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Minim 8 caractere"),
  orgName: z.string().min(2, "Minim 2 caractere").max(120),
  slug: slugSchema
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Parola este obligatorie")
});
