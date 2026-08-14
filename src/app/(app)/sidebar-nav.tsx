"use client";

import {
  Building2,
  FileText,
  Handshake,
  HardHat,
  Package,
  Receipt,
  Ship,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/projects", label: "Projects", icon: HardHat },
  { href: "/products", label: "Products", icon: Package },
  { href: "/opportunities", label: "Opportunities", icon: Handshake },
  { href: "/quotations", label: "Quotations", icon: FileText },
  { href: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
  { href: "/purchase-orders", label: "Purchase Orders", icon: Receipt },
  { href: "/shipments", label: "Shipments", icon: Ship },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-[3px]">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
