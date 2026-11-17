import { z } from "zod";

const measurement = z
  .string()
  .max(100)
  .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/);
export const offerSettingsSchema = z
  .object({
    standalone: z.boolean().optional(),
    requiredDelivery: z.boolean().optional(),
    receiptMethod: z.enum(["shipping", "pickup", "electronic"]).optional(),
    regionIds: z.array(z.string().min(1)).max(100).optional(),
    pickupPointIds: z.array(z.string().min(1)).max(100).optional(),
    origin: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .strict()
      .optional(),
    routeProfile: z.enum(["drive", "truck", "bicycle"]).optional(),
    quoteMinutes: z.number().int().min(1).max(1440).optional(),
    packages: z
      .array(
        z
          .object({
            count: z.number().int().min(1).max(10000),
            length_cm: measurement.optional(),
            width_cm: measurement.optional(),
            height_cm: measurement.optional(),
            weight_kg: measurement.optional(),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();
