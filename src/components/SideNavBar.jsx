"use client";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
} from "lucide-react";

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

  return (
    <div>
      <Sidebar collapsible="none" className=" !relative !w-40 !h-full !bg-white">
        <SidebarContent>
          <SidebarGroup className="!m-0 !p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`flex-col items-center justify-center h-20 rounded-none ${
                          isActive
                            ? "bg-red-50 border-r-4 border-primary !text-primary font-semibold"
                            : ""
                        }`}
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" className="w-full rounded-none">
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
