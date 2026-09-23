"use client";

import { useRouter } from "next/navigation";

import { completeTaskAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import { useT } from "@/lib/i18n/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  const { locale, t } = useT();
  const router = useRouter();

  function handleComplete(id: string) {
    void completeTaskAction(id).then(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("task.mine")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("task.mineEmpty")}</p>
        ) : (
          tasks.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between gap-4 rounded-md border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.title}</p>
                {row.description ? (
                  <p className="text-sm text-muted-foreground">
                    {row.description}
                  </p>
                ) : null}
                {row.dueDate ? (
                  <p className="text-xs text-muted-foreground">
                    {t("task.due", { date: formatDate(row.dueDate, locale) })}
                  </p>
                ) : null}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleComplete(row.id)}
              >
                {t("task.markDone")}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
