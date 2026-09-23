"use client";

import {
  Building2,
  CheckSquare,
  FileText,
  Handshake,
  HardHat,
  LayoutDashboard,
  Package,
  Receipt,
  Ship,
  ShieldCheck,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";

// `label` is a dictionary key, resolved at render — hrefs and icons are
// language-independent and stay as they were.
const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "nav.companies", icon: Building2 },
  { href: "/contacts", label: "nav.contacts", icon: Users },
  { href: "/projects", label: "nav.projects", icon: HardHat },
  { href: "/products", label: "nav.products", icon: Package },
  { href: "/opportunities", label: "nav.opportunities", icon: Handshake },
  { href: "/quotations", label: "nav.quotations", icon: FileText },
  { href: "/sales-orders", label: "nav.salesOrders", icon: ShoppingCart },
  { href: "/purchase-orders", label: "nav.purchaseOrders", icon: Receipt },
  { href: "/shipments", label: "nav.shipments", icon: Ship },
  { href: "/tasks", label: "nav.tasks", icon: CheckSquare },
];

const ADMIN_NAV_ITEM = {
  href: "/admin",
  label: "nav.admin",
  icon: ShieldCheck,
};

export function SidebarNav({
  isAdmin,
  openTaskCount,
}: {
  isAdmin: boolean;
  openTaskCount: number;
}) {
  const pathname = usePathname();
  const { t } = useT();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-[3px]">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-[11px] rounded-md px-3 py-2.5 text-sm transition-colors " +
              (active
                ? "bg-primary/12 text-primary"
                : "text-foreground hover:bg-accent")
            }
          >
            <item.icon className="size-[18px]" />
            {t(item.label)}
            {item.href === "/tasks" && openTaskCount > 0 ? (
              <Badge className="ml-auto">{openTaskCount}</Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
