import {
    Home,
    Calendar,
    Search,
    Zap,
    Plug,
    BarChart3,
    Bell,
    Settings,
    CreditCard,
    Shield,
    Database,
    HelpCircle,
    MessageSquare,
    CheckSquare,
    User,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const mainNav = [
    { title: "Home", url: "/", icon: Home },
    { title: "Meetings", url: "/meetings", icon: Calendar },
    { title: "Calendars", url: "/calendars", icon: Calendar },
    { title: "Tasks", url: "/tasks", icon: CheckSquare },
];

const workflowNav = [
    // { title: "Search", url: "/search", icon: Search },
    { title: "Automations", url: "/automations", icon: Zap },
    { title: "Integrations", url: "/integrations", icon: Plug },
    { title: "Insights", url: "/insights", icon: BarChart3 },
];

const settingsNav = [
    { title: "Profile", url: "/profile", icon: User },
    { title: "Admin", url: "/admin", icon: Settings },
    { title: "Billing", url: "/billing", icon: CreditCard },
    // { title: "Compliance", url: "/compliance", icon: Shield },
    { title: "Data Management", url: "/data-management", icon: Database },
    { title: "Help & Support", url: "/help-support", icon: HelpCircle },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const location = useLocation();
    const collapsed = state === "collapsed";

    const isActive = (url: string) => location.pathname === url;
    const role = sessionStorage.getItem("selected_workspace_role");
    return (
        <Sidebar collapsible="icon" className="border-r">
            <SidebarContent>
                <div className="px-4 py-4">
                    <Logo showText={!collapsed} size="sm" />
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                    >
                                        <NavLink to={item.url}>
                                            <item.icon className="h-5 w-5" />
                                            {!collapsed && (
                                                <span className="text-base">
                                                    {item.title}
                                                </span>
                                            )}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Workflow</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {workflowNav.map((item) => (
                                <SidebarMenuItem key={item.url}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.url)}
                                    >
                                        <NavLink to={item.url}>
                                            <item.icon className="h-5 w-5" />
                                            {!collapsed && (
                                                <span className="text-base">
                                                    {item.title}
                                                </span>
                                            )}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {settingsNav.map((item) => {
                                if (
                                    (item.title === "Admin" ||
                                        item.title === "Billing" ||
                                        item.title === "Data Management") &&
                                    !(role === "OWNER" || role === "ADMIN")
                                ) {
                                    return null;
                                }

                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.url)}
                                        >
                                            <NavLink to={item.url}>
                                                <item.icon className="h-5 w-5" />
                                                {!collapsed && (
                                                    <span className="text-base">
                                                        {item.title}
                                                    </span>
                                                )}
                                            </NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
