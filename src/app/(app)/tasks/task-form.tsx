"use client";

import { useActionState } from "react";

import { createTaskAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useT } from "@/lib/i18n/client";

export function TaskForm({
  users,
}: {
  users: { id: string; name: string | null }[];
}) {
  const { t } = useT();
  const [state, formAction, pending] = useActionState(
    createTaskAction,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("task.new")}</CardTitle>
      </CardHeader>
      <CardContent>
        {state?.error ? (
          <p className="mb-4 text-sm text-destructive">{t(state.error)}</p>
        ) : null}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title" required>
              {t("task.title")}
            </Label>
            <Input id="title" name="title" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("task.description")}</Label>
            <Textarea id="description" name="description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="assigneeUserId" required>
                {t("task.assignTo")}
              </Label>
              <Select
                name="assigneeUserId"
                items={users.map((u) => ({
                  value: u.id,
                  label: u.name ?? u.id,
                }))}
              >
                <SelectTrigger id="assigneeUserId">
                  <SelectValue placeholder={t("common.selectPerson")} />
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
              <Label htmlFor="dueDate">{t("task.dueDate")}</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? t("common.saving") : t("task.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
