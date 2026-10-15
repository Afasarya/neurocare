import { z } from "zod";
import { caregiverScopeSchema } from "./caregiver.contract";

export const caregiverInviteFormSchema = z
  .object({
    recipientEmail: z.string().trim().email("Masukkan alamat email yang valid.").max(254),
    scopes: z.array(caregiverScopeSchema).min(1, "Pilih minimal satu ringkasan terbatas.").max(2),
    confirmation: z.boolean().refine((value) => value, "Konfirmasi bahwa undangan belum memberikan akses."),
  })
  .strict();

export const reminderPreferenceFormSchema = z
  .object({
    reminderType: z.enum(["checkin", "follow_up", "action_review"]),
    localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pilih waktu yang valid."),
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pilih waktu mulai yang valid."),
    quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pilih waktu selesai yang valid."),
    enabled: z.boolean(),
    confirmation: z.boolean().refine((value) => value, "Konfirmasi bahwa ini hanya preferensi simulasi."),
  })
  .strict();

export type CaregiverInviteFormValues = z.infer<typeof caregiverInviteFormSchema>;
export type ReminderPreferenceFormValues = z.infer<typeof reminderPreferenceFormSchema>;
