import { z } from "zod";

export const createAvailabilitySchema = z.object({
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
});