export type EmployeeRecord = {
  id: string;
  businessId: string;
  profileId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "owner" | "manager" | "employee";
  isActive: boolean;
  presenceStatus: "online" | "away" | "offline";
  hiredAt: string | null;
  lastAccessAt: string | null;
  lastActivityAt: string | null;
};
