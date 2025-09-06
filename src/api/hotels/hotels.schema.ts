import { z } from 'zod';

export const getHotelsParameterSchema = z.object({
  hotel_ids: z.array(z.string()).optional(),
  destination_id: z.coerce.number().int().positive().optional(),
});

export type GetHotelsParameterDTO = z.infer<typeof getHotelsParameterSchema>;
