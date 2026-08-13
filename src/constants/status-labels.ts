export const statusLabels = {
  pending: "Pendente",
  responded: "Respondido",
  rejected: "Recusado",
  sent: "Enviado",
  preparing: "Em preparação",
  ready: "Pronto para retirada",
  completed: "Concluído",
  cancelled: "Cancelado",
  active: "Ativo",
  inactive: "Inativo",
  online: "Online",
  offline: "Offline",
} as const;

export function statusLabel(status: string): string {
  return statusLabels[status as keyof typeof statusLabels] ?? status;
}
