"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createActivityAction } from "./activity-timeline-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/date";

const TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
] as const;

export type ActivityRelatedType =
  | "company"
  | "contact"
  | "project"
  | "opportunity"
  | "sales_order"
  | "purchase_order";

type Activity = {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  occurredAt: Date;
  userName: string | null;
  userEmail: string;
};

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ActivityTimeline({
  relatedType,
  relatedId,
  activities,
}: {
  relatedType: ActivityRelatedType;
  relatedId: string;
  activities: Activity[];
}) {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    toDateTimeLocalValue(new Date()),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);

    // new Date(occurredAt) runs here in the browser, so it's interpreted in
    // the user's own local timezone before being sent as an absolute UTC
    // instant — not on the server, where the runtime's timezone could be
    // anything (crm-spec.md §7: store UTC, render in Asia/Singapore).
    const result = await createActivityAction({
      type,
      subject,
      body: body || null,
      occurredAt: occurredAt
        ? new Date(occurredAt).toISOString()
        : new Date().toISOString(),
      relatedType,
      relatedId,
    });

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    setSubject("");
    setBody("");
    setOccurredAt(toDateTimeLocalValue(new Date()));
    // This form's target URL never changes (no navigation happens), so
    // pending must be reset explicitly rather than relying on navigation to
    // do it — the same bug class fixed in quotation-builder.tsx /
    // sales-order-builder.tsx earlier this session.
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg">Activity</h3>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="activityType" required>
                  Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType((v as typeof type) ?? "note")}
                  items={TYPES}
                >
                  <SelectTrigger id="activityType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="occurredAt" required>
                  When
                </Label>
                <Input
                  id="occurredAt"
                  type="datetime-local"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject" required>
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="body">Notes</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Logging…" : "Log activity"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity logged yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((a) => (
            <Card key={a.id} className="py-4">
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {a.type}
                  </Badge>
                  <span className="font-medium">{a.subject}</span>
                </div>
                {a.body ? (
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(a.occurredAt)} · {a.userName ?? a.userEmail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
