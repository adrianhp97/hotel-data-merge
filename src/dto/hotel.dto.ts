import { z } from 'zod';

const imageSchema = z.object({ link: z.string(), description: z.string() });

export const hotelDtoSchema = z.object({
  id: z.string(),
  destination_id: z.number().int().positive(),
  name: z.string(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
  description: z.string().nullable().optional(),
  amenities: z.object({
    general: z.array(z.string()),
    room: z.array(z.string()),
  }),
  images: z.object({
    rooms: z.array(imageSchema),
    site: z.array(imageSchema),
    amenities: z.array(imageSchema),
  }),
  booking_conditions: z.array(z.string()),
});

export type HotelDTO = z.infer<typeof hotelDtoSchema>;
