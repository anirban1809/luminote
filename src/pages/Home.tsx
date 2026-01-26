import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Send,
    Paperclip,
    Plus,
    Calendar,
    Clock,
    Copy,
    FileText,
    Play,
    CheckSquare,
    ChevronDown,
    ChevronRight,
    Download,
    Save,
} from "lucide-react";
import { sseFetch } from "@/lib/api/api";
type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
    suggestedFollowUps?: string[];
};
type Source = {
    type: "meeting" | "transcript" | "task" | "account";
    title: string;
    metadata: string;
    snippet: string;
    timestamp?: string;
    confidence: string;
};

const escapeHtml = (str: string) =>
    str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const renderAssistantContent = (raw: string) => {
    const unescaped = raw
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "")
        .replace(/\\\\/g, "\\");

    const parts = unescaped.split(/```/);

    return parts.map((segment, index) => {
        const isCode = index % 2 === 1;
        if (isCode) {
            return (
                <pre
                    key={`code-${index}`}
                    className="bg-muted rounded-lg px-4 py-3 my-2 overflow-x-auto text-sm"
                >
                    <code>{segment}</code>
                </pre>
            );
        }

        const escaped = escapeHtml(segment);
        const inlineCode = escaped.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );
        const headings = inlineCode
            .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
            .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
            .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
            .replace(/^### (.*)$/gm, "<h3>$1</h3>")
            .replace(/^## (.*)$/gm, "<h2>$1</h2>")
            .replace(/^# (.*)$/gm, "<h1>$1</h1>");
        const bolded = headings.replace(
            /\*\*([^*]+)\*\*/g,
            "<strong>$1</strong>"
        );
        const italicized = bolded.replace(/\*([^*]+)\*/g, "<em>$1</em>");
        const withBreaks = italicized.replace(/\n/g, "<br />");

        return (
            <div
                key={`text-${index}`}
                className="prose prose-sm max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: withBreaks }}
            />
        );
    });
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [scopeChips, setScopeChips] = useState<string[]>([]);
    const [expandedSources, setExpandedSources] = useState<
        Record<string, boolean>
    >({});
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const upcomingMeetings = [
        {
            id: "1",
            title: "Weekly Team Sync",
            time: "Today, 2:00 PM",
            participants: ["John", "Sarah", "Mike"],
        },
        {
            id: "2",
            title: "Client Review - Acme Corp",
            time: "Tomorrow, 10:00 AM",
            participants: ["Lisa", "Tom"],
        },
        {
            id: "3",
            title: "Product Planning",
            time: "Dec 26, 3:00 PM",
            participants: ["Emma", "David", "Chris"],
        },
    ];
    const recordedMeetings = [
        {
            id: "4",
            title: "Q4 Strategy Discussion",
            date: "Dec 20, 2024",
            duration: "45 min",
        },
        {
            id: "5",
            title: "Design Review Session",
            date: "Dec 18, 2024",
            duration: "32 min",
        },
        {
            id: "6",
            title: "Sprint Retrospective",
            date: "Dec 15, 2024",
            duration: "28 min",
        },
    ];
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        const assistantMessageId = (Date.now() + 1).toString();

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await sseFetch("/sse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: input }),
            });

            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`
                );
            }
            if (!response.body) {
                throw new Error("No response body");
            }

            // Add initial assistant message
            setMessages((prev) => [
                ...prev,
                {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "",
                },
            ]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                assistantContent += decoder.decode(value, { stream: true });
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessageId
                            ? { ...m, content: assistantContent }
                            : m
                    )
                );
            }

            // Flush any remaining decoded text
            assistantContent += decoder.decode();
            if (assistantContent) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMessageId
                            ? { ...m, content: assistantContent }
                            : m
                    )
                );
            }
        } catch (error) {
            console.error("SSE error:", error);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMessageId
                        ? {
                              ...m,
                              content:
                                  "Sorry, an error occurred while processing your request.",
                          }
                        : m
                )
            );
        } finally {
            setIsLoading(false);
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const toggleSourceExpansion = (messageId: string) => {
        setExpandedSources((prev) => ({
            ...prev,
            [messageId]: !prev[messageId],
        }));
    };
    const addScope = (scope: string) => {
        setScopeChips([...scopeChips, scope]);
    };
    const removeScope = (scope: string) => {
        setScopeChips(scopeChips.filter((s) => s !== scope));
    };
    useEffect(() => {
        // Focus input on mount
        textareaRef.current?.focus();
    }, []);
    return (
        <div className="-mx-6 flex flex-col h-full relative">
            {/* Header */}
            <div className="px-16 pt-8">
                <h1 className="text-3xl font-bold tracking-tight">
                    Good Morning, Anirban
                </h1>
                <p className="text-muted-foreground mt-2">
                    Ask about your meetings, transcripts, and action items.
                </p>
            </div>

            {/* Context Bar */}
            <div className="flex-shrink-0 px-16 pt-8">
                <div className="flex items-center gap-2 flex-wrap">
                    {scopeChips.map((chip) => (
                        <Badge key={chip} variant="secondary" className="gap-1">
                            {chip}
                            <button
                                className="ml-1"
                                onClick={() => removeScope(chip)}
                            >
                                ×
                            </button>
                        </Badge>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScope("Last 7 days")}
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        Add scope
                    </Button>
                    <Button variant="outline" size="sm">
                        <Calendar className="mr-1 h-3 w-3" />
                        Attach meetings
                    </Button>
                </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto pb-[280px]">
                {messages.length === 0 ? (
                    <div className="max-w-5xl mx-auto py-6 px-8 pb-32">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Upcoming Meetings */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium">
                                        Upcoming Meetings
                                    </h2>
                                    <Link
                                        to="/meetings?tab=upcoming"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        View all
                                    </Link>
                                </div>
                                <div className="grid gap-3">
                                    {upcomingMeetings.map((meeting) => (
                                        <Card key={meeting.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm">
                                                            {meeting.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {meeting.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex -space-x-2">
                                                        {meeting.participants
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    participant,
                                                                    idx
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background"
                                                                    >
                                                                        {participant.charAt(
                                                                            0
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Recorded Meetings */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-medium">
                                        Recently Recorded
                                    </h2>
                                    <Link
                                        to="/meetings?tab=recorded"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        View all
                                    </Link>
                                </div>
                                <div className="grid gap-3">
                                    {recordedMeetings.map((meeting) => (
                                        <Card key={meeting.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm">
                                                            {meeting.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                {meeting.date}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {
                                                                    meeting.duration
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
                        {messages.map((message) => (
                            <div key={message.id} className="space-y-3">
                                <div
                                    className={`flex ${
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    {message.role === "user" ? (
                                        <div className="max-w-[80%] text-sm whitespace-pre-wrap bg-primary text-primary-foreground rounded-lg px-4 py-3">
                                            {message.content}
                                        </div>
                                    ) : message.content === "" && isLoading ? (
                                        <div className="max-w-[80%] flex items-center gap-2 text-muted-foreground">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                                            </div>
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    ) : (
                                        <div className="max-w-[80%] text-sm">
                                            {renderAssistantContent(
                                                message.content
                                            )}
                                        </div>
                                    )}
                                </div>

                                {message.role === "assistant" &&
                                    message.sources && (
                                        <Card>
                                            <CardHeader
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    toggleSourceExpansion(
                                                        message.id
                                                    )
                                                }
                                            >
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm">
                                                        Sources (
                                                        {message.sources.length}
                                                        )
                                                    </CardTitle>
                                                    {expandedSources[
                                                        message.id
                                                    ] ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </CardHeader>
                                            {expandedSources[message.id] && (
                                                <CardContent className="space-y-3">
                                                    {message.sources.map(
                                                        (source, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="space-y-2"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline">
                                                                                {
                                                                                    source.type
                                                                                }
                                                                            </Badge>
                                                                            <span className="font-medium text-sm">
                                                                                {
                                                                                    source.title
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {
                                                                                source.metadata
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        {
                                                                            source.confidence
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm bg-muted p-2 rounded">
                                                                    "
                                                                    {
                                                                        source.snippet
                                                                    }
                                                                    "
                                                                </p>
                                                                <div className="flex gap-2 flex-wrap">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        <Play className="mr-1 h-3 w-3" />
                                                                        Play
                                                                        from{" "}
                                                                        {
                                                                            source.timestamp
                                                                        }
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        <FileText className="mr-1 h-3 w-3" />
                                                                        Open
                                                                        transcript
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        <Save className="mr-1 h-3 w-3" />
                                                                        Save
                                                                        snippet
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        <CheckSquare className="mr-1 h-3 w-3" />
                                                                        Create
                                                                        task
                                                                    </Button>
                                                                </div>
                                                                {idx <
                                                                    message
                                                                        .sources
                                                                        .length -
                                                                        1 && (
                                                                    <Separator className="my-3" />
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>
                                    )}

                                {message.role === "assistant" &&
                                    message.suggestedFollowUps && (
                                        <div className="flex gap-2 flex-wrap">
                                            {message.suggestedFollowUps.map(
                                                (followUp) => (
                                                    <Badge
                                                        key={followUp}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-accent"
                                                        onClick={() =>
                                                            setInput(followUp)
                                                        }
                                                    >
                                                        {followUp}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    )}

                                {message.role === "assistant" && (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Copy className="mr-1 h-3 w-3" />
                                            Copy
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Download className="mr-1 h-3 w-3" />
                                            Export
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Save className="mr-1 h-3 w-3" />
                                            Save to notes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Composer - Sticky at bottom */}
            <div className="sticky bottom-0 pt-4 pl-4 pr-4 mt-auto bg-background w-full">
                {/* Top fade effect */}
                <div className="absolute w-full -top-12 left-0 right-0 h-12 bg-gradient-to-t from-background pointer-events-none" />
                <div className="max-w-3xl mx-auto w-full space-y-3">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            Mention meeting
                        </Button>
                        <Button variant="outline" size="sm">
                            <Clock className="mr-1 h-3 w-3" />
                            Insert timestamp
                        </Button>
                        <Button variant="outline" size="sm">
                            <Paperclip className="mr-1 h-3 w-3" />
                            Attach
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Ask a question or type / for shortcuts..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[60px] resize-none"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Enter to send, Shift+Enter for new line
                        </p>
                        <Button variant="link" size="sm" className="text-xs">
                            Prompt tips
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
