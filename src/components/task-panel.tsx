"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { completeTaskAction } from "@/app/(app)/tasks/actions";
import { createTaskForRelatedAction } from "./task-panel-actions";
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
import { formatDate } from "@/lib/date";

// Same 6 values as activity-timeline.tsx's ActivityRelatedType — mirrors
// that file's own local-union convention rather than importing from the
// schema, same reasoning that file already established.
export type TaskRelatedType =
  | "company"
  | "contact"
  | "project"
  | "opportunity"
  | "sales_order"
  | "purchase_order";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "done";
  dueDate: Date | null;
  assigneeUserId: string;
  assigneeName: string | null;
  assigneeEmail: string;
};

export function TaskPanel({
  relatedType,
  relatedId,
  tasks,
  users,
  currentUserId,
}: {
  relatedType: TaskRelatedType;
  relatedId: string;
  tasks: Task[];
  users: { id: string; name: string | null }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await createTaskForRelatedAction({
      title,
      description: description || null,
      assigneeUserId,
      dueDate: dueDate || null,
      relatedType,
      relatedId,
    });

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    setTitle("");
    setDescription("");
    setAssigneeUserId(undefined);
    setDueDate("");
    router.refresh();
    setPending(false);
  }

  function handleComplete(id: string) {
    void completeTaskAction(id).then(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg">Tasks</h3>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="taskTitle" required>
                Task
              </Label>
              <Input
                id="taskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="taskAssignee" required>
                  Assign to
                </Label>
                <Select
                  value={assigneeUserId}
                  onValueChange={(v) => setAssigneeUserId(v ?? undefined)}
                  items={users.map((u) => ({
                    value: u.id,
                    label: u.name ?? u.id,
                  }))}
                >
                  <SelectTrigger id="taskAssignee">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name ?? u.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="taskDueDate">Due date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Saving…" : "Create task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((t) => (
            <Card key={t.id} className="py-4">
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={t.status === "done" ? "secondary" : "default"}
                      className="capitalize"
                    >
                      {t.status}
                    </Badge>
                    <span className="font-medium">{t.title}</span>
                  </div>
                  {t.description ? (
                    <p className="text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Assigned to {t.assigneeName ?? t.assigneeEmail}
                    {t.dueDate ? ` · Due ${formatDate(t.dueDate)}` : ""}
                  </p>
                </div>
                {t.status === "open" && t.assigneeUserId === currentUserId ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleComplete(t.id)}
                  >
                    Mark done
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
