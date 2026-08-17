import { z } from "zod";

export const newQuoteSchema = z.object({
  partName: z.string().trim().min(2, "Informe o nome da peça."),
  partQuantity: z.number().int().positive("Informe uma quantidade válida."),
  brand: z.string().trim(),
  vehicleModel: z.string().trim(),
  vehicleYear: z.string().trim(),
  vehicleEngine: z.string().trim(),
  notes: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  radius: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(50)], {
    error: "Selecione um raio de busca.",
  }),
  items: z.array(z.object({ name: z.string().trim().min(2), brand: z.string().trim(), quantity: z.number().positive(), unit: z.string().trim(), notes: z.string().trim() })).max(9),
});
