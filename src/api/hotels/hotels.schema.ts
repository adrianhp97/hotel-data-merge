import { z } from 'zod';

export const getHotelsParameterSchema = z.object({
  hotel_ids: z.array(z.string()).optional(),
  destination_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().min(1).default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
});

export type GetHotelsParameterDTO = z.infer<typeof getHotelsParameterSchema>;
