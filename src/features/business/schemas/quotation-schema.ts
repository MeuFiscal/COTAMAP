import { z } from "zod";

export const quotationSchema = z.object({
  amount: z.string().transform((value) => value.replace(/\s/g, "").replace("R$", "").replace(/\./g, "").replace(",", ".")).pipe(z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um preço válido.")),
  notes: z.string().max(500, "Use até 500 caracteres.").optional().default(""),
  availability: z.enum(["Pronta", "Separando", "Sob encomenda"]),
  pickupMinutes: z.string().regex(/^[1-9]\d*$/, "Informe um prazo válido."),
});

export type QuotationFormInput = z.input<typeof quotationSchema>;
export type QuotationFormData = z.output<typeof quotationSchema>;
