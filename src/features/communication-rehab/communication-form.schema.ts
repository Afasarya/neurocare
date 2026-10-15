import { z } from "zod";

export const communicationSessionFormSchema = z
  .object({
    notes: z.string().trim().max(500, "Catatan maksimal 500 karakter."),
    confirmation: z.boolean().refine((value) => value, "Konfirmasi bahwa ini hanya catatan penggunaan."),
  })
  .strict();

export type CommunicationSessionFormValues = z.infer<typeof communicationSessionFormSchema>;
