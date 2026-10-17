import { z } from "zod";

export const requestInputSchema = z.object({
  id: z.string().uuid(),
  string: z.string().max(20000).optional(),
  number: z.number().finite().optional(),
  boolean: z.boolean().optional(),
  option: z
    .union([z.string().uuid(), z.object({ id: z.string().uuid() })])
    .optional(),
});
export const requestSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  steps: z
    .array(
      z.object({
        id: z.string().uuid(),
        inputs: z.array(requestInputSchema).max(200),
      }),
    )
    .max(100),
});
export type IRequestInput = z.infer<typeof requestInputSchema>;
export type IRequestSubmission = z.infer<typeof requestSubmissionSchema>;
export interface IRequestFields {
  steps: Record<
    string,
    {
      id?: string;
      inputs: Record<string, Omit<IRequestInput, "id"> & { id?: string }>;
    }
  >;
}
export function toRequestSubmission(
  fields: IRequestFields,
  submissionId: string,
): IRequestSubmission {
  return requestSubmissionSchema.parse({
    submissionId,
    steps: Object.entries(fields.steps ?? {}).map(([id, step]) => ({
      id,
      inputs: Object.entries(step.inputs ?? {}).map(([inputId, input]) => ({
        ...input,
        id: inputId,
      })),
    })),
  });
}
