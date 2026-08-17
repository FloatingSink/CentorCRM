"use client";

import { useRouter } from "next/navigation";

import { completeTaskAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const router = useRouter();

  function handleComplete(id: string) {
    void completeTaskAction(id).then(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open tasks assigned to you.
          </p>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description ? (
                  <p className="text-sm text-muted-foreground">
                    {t.description}
                  </p>
                ) : null}
                {t.dueDate ? (
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(t.dueDate)}
                  </p>
                ) : null}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleComplete(t.id)}
              >
                Mark done
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
