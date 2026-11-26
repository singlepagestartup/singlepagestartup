import { z } from "zod";

export const chatMessageFormSchema = z
  .object({
    description: z.string(),
    files: z
      .custom<File[]>(
        (value) =>
          Array.isArray(value) && value.every((item) => item instanceof File),
      )
      .or(z.string().array())
      .optional(),
  })
  .refine(
    ({ description, files }) => Boolean(description.trim() || files?.length),
    {
      path: ["description"],
      message: "Enter a message or attach a file.",
    },
  );

export const messageEditFormSchema = z.object({
  description: z.string().min(1),
});

export type ChatMessageFormValues = z.infer<typeof chatMessageFormSchema>;
export type MessageEditFormValues = z.infer<typeof messageEditFormSchema>;
