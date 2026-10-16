import { z } from "zod";

export const aiGatewayInvalidParamSchema = z
  .object({
    field: z.string().min(1),
    rejectedValue: z.unknown().optional(),
    reason: z.string().min(1),
  })
  .strict();

export const aiGatewayProblemDetailsSchema = z
  .object({
    type: z.string().url(),
    title: z.string().min(1),
    status: z.number().int().min(400).max(599),
    detail: z.string().min(1),
    instance: z.string().min(1),
    errorCode: z.string().regex(/^ERR_[A-Z0-9_]+$/),
    invalidParams: z.array(aiGatewayInvalidParamSchema).optional(),
    timestamp: z.string().datetime(),
  })
  .strict();

export type AiGatewayProblemDetails = z.infer<
  typeof aiGatewayProblemDetailsSchema
>;
