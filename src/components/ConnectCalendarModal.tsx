import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api/api";

interface ConnectCalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const mockGoogleCalendars = [
    {
        id: "g1",
        name: "Personal",
        email: "john.doe@gmail.com",
        color: "#4285F4",
    },
    { id: "g2", name: "Work", email: "john.doe@company.com", color: "#0F9D58" },
    { id: "g3", name: "Family", email: "john.doe@gmail.com", color: "#F4B400" },
    {
        id: "g4",
        name: "Projects",
        email: "john.doe@gmail.com",
        color: "#DB4437",
    },
];

const mockMicrosoftCalendars = [
    {
        id: "m1",
        name: "Calendar",
        email: "john@microsoft-account.com",
        color: "#0078D4",
    },
    {
        id: "m2",
        name: "Work Events",
        email: "john@microsoft-account.com",
        color: "#7719AA",
    },
    {
        id: "m3",
        name: "Team Calendar",
        email: "john@microsoft-account.com",
        color: "#00A4EF",
    },
];

export default function ConnectCalendarModal({
    open,
    onOpenChange,
}: ConnectCalendarModalProps) {
    const [step, setStep] = useState<"provider" | "calendars">("provider");
    const [selectedProvider, setSelectedProvider] = useState<
        "google" | "microsoft" | null
    >(null);
    const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
    const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
    const [calendars, setCalendars] = useState([]);
    const workspaceId = sessionStorage.getItem("selected_workspace_id");

    const fetchCalendars = async (provider: "google" | "microsoft") => {
        setIsLoadingCalendars(true);

        const res = await apiFetch(
            `/${provider}/calendars?workspaceId=${workspaceId}`
        );

        const result = await res.json();
        console.log(result);

        if (!result.ok) {
            throw new Error("Failed to fetch calendars");
        }

        setIsLoadingCalendars(false);
        setCalendars(result.calendars);
    };

    const login = useGoogleLogin({
        flow: "auth-code", // this is the “offline” style flow
        scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        onSuccess: async (codeResponse) => {
            const res = await apiFetch(
                `/connect/google?workspaceId=${workspaceId}`,
                {
                    method: "POST",
                    body: JSON.stringify(codeResponse),
                }
            );

            const result = await res.json();

            if (result.ok) {
                await fetchCalendars("google");
            }
        },
        onError: (err) => {
            console.error("Google login error", err);
        },
    });

    const handleProviderSelect = (provider: "google" | "microsoft") => {
        if (provider === "google") {
            login();
        }

        setSelectedProvider(provider);
        setStep("calendars");
        setIsLoadingCalendars(true);
    };

    const handleCalendarToggle = (calendarId: string) => {
        setSelectedCalendars((prev) =>
            prev.includes(calendarId)
                ? prev.filter((id) => id !== calendarId)
                : [...prev, calendarId]
        );
    };

    const handleConnect = () => {
        const provider = selectedProvider === "google" ? "Google" : "Microsoft";
        toast({
            title: "Calendars connected",
            description: `Successfully connected ${selectedCalendars.length} ${provider} calendar(s)`,
        });
        handleClose();
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after animation completes
        setTimeout(() => {
            setStep("provider");
            setSelectedProvider(null);
            setSelectedCalendars([]);
            setIsLoadingCalendars(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === "provider"
                            ? "Connect Calendar"
                            : `Select ${
                                  selectedProvider === "google"
                                      ? "Google"
                                      : "Microsoft"
                              } Calendars`}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "provider"
                            ? "Choose a calendar provider to connect"
                            : "Select which calendars you want to sync"}
                    </DialogDescription>
                </DialogHeader>

                {step === "provider" && (
                    <div className="space-y-3 py-4">
                        <Button
                            variant="outline"
                            className="w-full h-auto py-4 px-4 justify-start gap-3"
                            onClick={() => handleProviderSelect("google")}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-white">
                                <svg viewBox="0 0 24 24" className="h-6 w-6">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">
                                    Google Calendar
                                </div>
                                <div className="text-sm">
                                    Connect your Google calendars
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-auto py-4 px-4 justify-start gap-3"
                            onClick={() => handleProviderSelect("microsoft")}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#0078D4]">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-6 w-6"
                                    fill="white"
                                >
                                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <div className="font-semibold">
                                    Microsoft 365
                                </div>
                                <div className="text-sm">
                                    Connect your Microsoft calendars
                                </div>
                            </div>
                        </Button>
                    </div>
                )}

                {step === "calendars" && (
                    <div className="space-y-4 py-4">
                        {isLoadingCalendars ? (
                            <div className="space-y-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : (
                            <>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12"></TableHead>
                                                <TableHead className="w-8"></TableHead>
                                                <TableHead>
                                                    Calendar Name
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {calendars.map((calendar) => (
                                                <TableRow key={calendar.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            id={calendar.id}
                                                            checked={selectedCalendars.includes(
                                                                calendar.id
                                                            )}
                                                            onCheckedChange={() =>
                                                                handleCalendarToggle(
                                                                    calendar.id
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    calendar.color,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {calendar.summary}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep("provider")}
                                    >
                                        Back
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleConnect}
                                            disabled={
                                                selectedCalendars.length === 0
                                            }
                                        >
                                            Connect {selectedCalendars.length}{" "}
                                            Calendar
                                            {selectedCalendars.length !== 1
                                                ? "s"
                                                : ""}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
