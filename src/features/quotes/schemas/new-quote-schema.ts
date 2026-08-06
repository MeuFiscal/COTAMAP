import { z } from "zod";

export const newQuoteSchema = z.object({
  partName: z.string().trim().min(2, "Informe o nome da peça."),
  brand: z.string().trim(),
  vehicleModel: z.string().trim(),
  vehicleYear: z.string().trim(),
  vehicleEngine: z.string().trim(),
  notes: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  radius: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(50)], {
    error: "Selecione um raio de busca.",
  }),
});
