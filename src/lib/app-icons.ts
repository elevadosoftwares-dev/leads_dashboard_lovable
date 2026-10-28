import {
  AlarmClock,
  Boxes,
  Briefcase,
  Calendar,
  ClipboardList,
  FileCheck,
  FileText,
  FolderSearch,
  KeyRound,
  LayoutGrid,
  ListTodo,
  Mail,
  Receipt,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icons an app tile can use. dbo.apps.icon stores one of these keys. */
export const appIcons: Record<string, LucideIcon> = {
  quotation: FileText,
  sic: Tags,
  client: Users,
  password: KeyRound,
  expiry: AlarmClock,
  store: Boxes,
  tasks: ListTodo,
  invoice: Receipt,
  hrm: UserCog,
  wcr: FileCheck,
  purchase: ShoppingCart,
  payable: Wallet,
  documents: FolderSearch,
  checklist: ClipboardList,
  calendar: Calendar,
  mail: Mail,
  delivery: Truck,
  maintenance: Wrench,
  business: Briefcase,
};

/** Resolves dbo.apps.icon to an icon component, falling back to a generic grid. */
export function resolveAppIcon(icon: string): LucideIcon {
  return appIcons[icon] ?? LayoutGrid;
}
