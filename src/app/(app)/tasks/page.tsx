import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { getMyTasks } from "@/server/tasks";
import { getUsers } from "@/server/users";

export default async function TasksPage() {
  const [tasks, users, locale] = await Promise.all([
    getMyTasks(),
    getUsers(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold">{t(locale, "task.heading")}</h1>
      <TaskList tasks={tasks} />
      <TaskForm users={users} />
    </div>
  );
}
