"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  UserRoundPen,
  CircleDollarSign,
  CreditCard,
  Calendar,
  LogOut,
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";

const items = [
  {
    title: "Profile",
    url: "/profile",
    icon: UserRoundPen,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: CircleDollarSign,
  },
  {
    title: "Payment",
    url: "/payment",
    icon: CreditCard,
  },
  {
    title: "Booking History",
    url: "/booking-history",
    icon: Calendar,
  },
];

export default function SideNavBar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <Sidebar
      collapsible="none"
      className="!relative !w-full !h-full !bg-white border-none"
    >
        <SidebarContent className="p-4">
          <SidebarGroup className="!p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`flex items-center gap-3 px-3 h-11 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 !text-primary font-semibold"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className={`size-5 ${isActive ? "text-primary" : "text-gray-500"}`} />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 h-11 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            onClick={async () => {
              await fetch("/api/auth/logout", {
                method: "POST",
              });
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut className="size-5" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }
