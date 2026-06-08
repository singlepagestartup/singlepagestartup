import { z } from "zod";

export const chatMessageFormSchema = z.object({
  description: z.string().min(1),
  files: z
    .custom<File[]>(
      (value) =>
        Array.isArray(value) && value.every((item) => item instanceof File),
    )
    .or(z.string().array())
    .optional(),
});

export const messageEditFormSchema = z.object({
  description: z.string().min(1),
});

export type ChatMessageFormValues = z.infer<typeof chatMessageFormSchema>;
export type MessageEditFormValues = z.infer<typeof messageEditFormSchema>;
