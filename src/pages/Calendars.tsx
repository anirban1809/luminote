import { useEffect, useState } from "react";
import {
    Calendar as CalendarIcon,
    Plus,
    RefreshCw,
    Check,
    Loader2,
    MoreHorizontal,
    Trash2,
} from "lucide-react";
import ConnectCalendarModal from "@/components/ConnectCalendarModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Platform icons as simple SVG components
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const MicrosoftIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="10" height="10" fill="#F25022" />
        <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
        <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
        <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
);

interface CalendarData {
    id: string;
    name: string;
    email: string;
    provider: "google" | "microsoft";
    accountId: string;
    status: "CONNECTED" | "SYNCING" | "NOT_CONNECTED";
    auto_join: boolean;
    owner?: string;
}

interface ConnectedAccount {
    id: string;
    email: string;
    provider: "google" | "microsoft";
    lastSync: string;
}

export default function Calendars() {
    const [connectModalOpen, setConnectModalOpen] = useState(false);
    const [calendarToDisconnect, setCalendarToDisconnect] =
        useState<CalendarData | null>(null);
    const [accountToRemove, setAccountToRemove] =
        useState<ConnectedAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectedAccounts, setConnectedAccounts] = useState<
        ConnectedAccount[]
    >([]);
    const [connectedCalendars, setConnectedCalendars] = useState<
        CalendarData[]
    >([]);
    const [availableCalendars, setAvailableCalendars] = useState<
        CalendarData[]
    >([]);
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const loadCalendars = async () => {
        setLoading(true);
        const workspaceId = sessionStorage.getItem("selected_workspace_id");
        if (!workspaceId) {
            toast({
                title: "No workspace selected",
                description:
                    "Select a workspace to view your connected calendars.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        try {
            const response = await apiFetch(
                `/calendars?workspaceId=${workspaceId}`
            );
            const result = await response.json();

            const calendarsFromApi = Array.isArray(result)
                ? result
                : result?.calendars ?? [];

            const normalizedCalendars: CalendarData[] = calendarsFromApi.map(
                (calendar: any) => {
                    const provider: "google" | "microsoft" =
                        calendar.provider === "microsoft"
                            ? "microsoft"
                            : "google";
                    const email =
                        calendar.owner_email ||
                        calendar.user_email ||
                        calendar.email ||
                        "";
                    const id =
                        calendar.calendar_id ||
                        calendar.id ||
                        calendar.SK ||
                        crypto.randomUUID();
                    const accountId = `${provider}-${email || "account"}`;

                    return {
                        id,
                        name:
                            calendar.calendar_name ||
                            calendar.summary ||
                            calendar.name ||
                            calendar.calendar_id ||
                            "Calendar",
                        email,
                        provider,
                        accountId,
                        status:
                            (calendar.status as CalendarData["status"]) ||
                            "CONNECTED",
                        auto_join: Boolean(calendar.auto_join),
                        owner: calendar.owner,
                    };
                }
            );

            const accountsMap = new Map<string, ConnectedAccount>();
            normalizedCalendars.forEach((calendar) => {
                if (!accountsMap.has(calendar.accountId)) {
                    accountsMap.set(calendar.accountId, {
                        id: calendar.accountId,
                        email: calendar.email || "Calendar account",
                        provider: calendar.provider,
                        lastSync: "Just now",
                    });
                }
            });

            setConnectedAccounts(Array.from(accountsMap.values()));
            setConnectedCalendars(normalizedCalendars);
            setAvailableCalendars([]);
        } catch (error) {
            console.error("Failed to fetch calendars:", error);
            toast({
                title: "Unable to load calendars",
                description: "Please try refreshing the page.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectCalendar = () => {
        if (!calendarToDisconnect) return;
        const workspaceId = sessionStorage.getItem("selected_workspace_id");
        if (!workspaceId) {
            toast({
                title: "No workspace selected",
                description:
                    "Select a workspace before disconnecting a calendar.",
                variant: "destructive",
            });
            return;
        }

        const { id, email } = calendarToDisconnect;

        setIsDisconnecting(true);
        apiFetch(`/calendars?workspaceId=${workspaceId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                calendarId: id,
                email,
            }),
        })
            .then((res) => res.json())
            .then((result) => {
                if (!result.ok) {
                    throw new Error("Failed to disconnect calendar");
                }
                toast({
                    title: "Calendar disconnected",
                    description: `${calendarToDisconnect.name} has been removed.`,
                });
                setCalendarToDisconnect(null);
                loadCalendars();
            })
            .catch((error) => {
                console.error("Failed to disconnect calendar:", error);
                toast({
                    title: "Unable to disconnect calendar",
                    description: "Please try again.",
                    variant: "destructive",
                });
            })
            .finally(() => setIsDisconnecting(false));
    };

    const handleRemoveAccount = () => {
        console.log("Removing account:", accountToRemove?.email);
        setAccountToRemove(null);
    };

    const handleAddAccount = (provider: "google" | "microsoft") => {
        console.log("Adding account for:", provider);
        setConnectModalOpen(true);
    };

    const handleConnectCalendar = (calendar: CalendarData) => {
        console.log("Connecting calendar:", calendar.name);
    };

    useEffect(() => {
        loadCalendars();
    }, []);

    const getAccountsForPlatform = (platform: "google" | "microsoft") =>
        connectedAccounts.filter((a) => a.provider === platform);

    const getCalendarsForAccount = (accountId: string) =>
        connectedCalendars.filter((c) => c.accountId === accountId);

    const getAvailableCalendarsForAccount = (accountId: string) =>
        availableCalendars.filter((c) => c.accountId === accountId);

    const hasAnyAccounts = connectedAccounts.length > 0;

    const renderAccountSection = (account: ConnectedAccount) => {
        const calendars = getCalendarsForAccount(account.id);
        const available = getAvailableCalendarsForAccount(account.id);
        const Icon = account.provider === "google" ? GoogleIcon : MicrosoftIcon;

        return (
            <div key={account.id} className="border border-border rounded-lg">
                {/* Account Header */}
                <div className="flex items-center justify-between p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <div>
                            <p className="font-medium">{account.email}</p>
                            <p className="text-xs text-muted-foreground">
                                Last synced {account.lastSync}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setAccountToRemove(account)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Calendars */}
                <div className="divide-y divide-border">
                    {calendars.length === 0 && available.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No calendars found for this account
                        </div>
                    ) : (
                        <>
                            {/* Connected Calendars */}
                            {calendars.map((calendar) => (
                                <div
                                    key={calendar.id}
                                    className="flex items-center justify-between p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {calendar.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="outline"
                                            className={
                                                calendar.status === "CONNECTED"
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                            }
                                        >
                                            {calendar.status === "SYNCING" ? (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            ) : (
                                                <Check className="h-3 w-3 mr-1" />
                                            )}
                                            {calendar.status === "SYNCING"
                                                ? "Syncing"
                                                : "Connected"}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Auto-Join
                                            </span>
                                            <Switch
                                                checked={calendar.auto_join}
                                                onCheckedChange={() => {}}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() =>
                                                setCalendarToDisconnect(
                                                    calendar
                                                )
                                            }
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Available Calendars */}
                            {available.map((calendar) => (
                                <div
                                    key={calendar.id}
                                    className="flex items-center justify-between p-4 opacity-60"
                                >
                                    <div className="flex items-center gap-3">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {calendar.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">
                                            Not connected
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleConnectCalendar(calendar)
                                            }
                                        >
                                            Connect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const renderPlatformGroup = (
        platform: "google" | "microsoft",
        platformName: string,
        Icon: React.ComponentType<{ className?: string }>
    ) => {
        const accounts = getAccountsForPlatform(platform);

        return (
            <div key={platform} className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold">{platformName}</h3>
                        <Badge variant="secondary" className="text-xs">
                            {accounts.length}{" "}
                            {accounts.length === 1 ? "account" : "accounts"}
                        </Badge>
                    </div>
                </div>

                {accounts.length > 0 && (
                    <div className="space-y-3">
                        {accounts.map(renderAccountSection)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <ConnectCalendarModal
                open={connectModalOpen}
                onOpenChange={setConnectModalOpen}
                onConnected={loadCalendars}
            />

            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Calendars
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your calendar connections and sync settings
                    </p>
                </div>
                <Button onClick={() => setConnectModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Calendar
                </Button>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2].map((i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                    <div className="border border-border rounded-lg">
                                        <div className="p-4 bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-5 w-5" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </div>
                                        {[1, 2].map((j) => (
                                            <div
                                                key={j}
                                                className="flex items-center justify-between p-4 border-t border-border"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-5 w-20 rounded-full" />
                                                    <Skeleton className="h-5 w-10 rounded-full" />
                                                    <Skeleton className="h-8 w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !hasAnyAccounts ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-muted p-6 mb-6">
                                <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                No calendars connected
                            </h3>
                            <p className="text-muted-foreground max-w-md mb-6">
                                Connect your Google or Microsoft calendar
                                accounts to view and manage your calendars,
                                enable auto-join, and sync your meetings.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleAddAccount("google")}
                                >
                                    <GoogleIcon className="h-4 w-4 mr-2" />
                                    Connect Google
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleAddAccount("microsoft")
                                    }
                                >
                                    <MicrosoftIcon className="h-4 w-4 mr-2" />
                                    Connect Microsoft
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {getAccountsForPlatform("google").length > 0 &&
                                renderPlatformGroup(
                                    "google",
                                    "Google Calendar",
                                    GoogleIcon
                                )}
                            {getAccountsForPlatform("google").length > 0 &&
                                getAccountsForPlatform("microsoft").length >
                                    0 && <Separator />}
                            {getAccountsForPlatform("microsoft").length > 0 &&
                                renderPlatformGroup(
                                    "microsoft",
                                    "Microsoft Outlook",
                                    MicrosoftIcon
                                )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Disconnect Calendar Dialog */}
            <AlertDialog
                open={!!calendarToDisconnect}
                onOpenChange={(open) => !open && setCalendarToDisconnect(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Calendar</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <span>
                                Are you sure you want to disconnect{" "}
                                <span className="font-medium text-foreground">
                                    {calendarToDisconnect?.name}
                                </span>{" "}
                                ({calendarToDisconnect?.email})?
                            </span>
                            <span className="block mt-2">
                                Syncing will stop and upcoming events from this
                                calendar will be removed from your account.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDisconnectCalendar}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDisconnecting}
                        >
                            {isDisconnecting
                                ? "Disconnecting..."
                                : "Disconnect"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Account Dialog */}
            <AlertDialog
                open={!!accountToRemove}
                onOpenChange={(open) => !open && setAccountToRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Account</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <span>
                                Are you sure you want to remove{" "}
                                <span className="font-medium text-foreground">
                                    {accountToRemove?.email}
                                </span>
                                ?
                            </span>
                            <span className="block mt-2">
                                All calendars associated with this account will
                                be disconnected and their events will be removed
                                from your account.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove Account
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
