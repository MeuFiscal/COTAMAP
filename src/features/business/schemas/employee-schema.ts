import { z } from "zod";

export const employeeSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().email("Informe um e-mail válido."),
  phone: z.string().trim().optional(),
  role: z.enum(["manager", "employee"]),
  pin: z.string().regex(/^\d{4}(\d{2})?$/, "O PIN deve ter 4 ou 6 dígitos."),
});

export const employeeEditSchema = employeeSchema.pick({ fullName: true, phone: true, role: true }).extend({ isActive: z.boolean() });
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EmployeeEditInput = z.infer<typeof employeeEditSchema>;
