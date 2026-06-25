import { z } from 'zod';

// ─── Login ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Project ──────────────────────────────────────────────────────────────────

export const ProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').trim(),
  description: z.string().min(1, 'Project description is required').trim(),
  image: z
    .string()
    .min(1, 'Project image URL or path is required')
    .trim(),
  link: z
    .string()
    .min(1, 'Project link URL is required')
    .url('Project link must be a valid URL')
    .trim(),
  order: z.number().int().optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

// ─── Contact ──────────────────────────────────────────────────────────────────

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().min(1, 'Email or phone is required').trim(),
  message: z.string().min(1, 'Message is required').trim(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// ─── Expertise ────────────────────────────────────────────────────────────────

export const ExpertiseSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  icon: z.string().min(1, 'Icon is required').trim(),
  chipsLabel: z.string().min(1, 'Chips label is required').trim(),
  chips: z.array(z.string().trim()).min(1, 'At least one chip is required'),
  order: z.number().int().optional(),
});

export type ExpertiseInput = z.infer<typeof ExpertiseSchema>;

// ─── Timeline ─────────────────────────────────────────────────────────────────

export const TimelineSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  subtitle: z.string().min(1, 'Subtitle is required').trim(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required').trim(),
  type: z.enum(['work', 'education']),
  order: z.number().int().optional(),
});

export type TimelineInput = z.infer<typeof TimelineSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Formats Zod validation errors into a flat array of `{ field, message }`
 * objects suitable for JSON API responses.
 */
export function formatZodErrors(
  error: z.ZodError
): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message,
  }));
}
