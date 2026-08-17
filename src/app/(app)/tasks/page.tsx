import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { getMyTasks } from "@/server/tasks";
import { getUsers } from "@/server/users";

export default async function TasksPage() {
  const [tasks, users] = await Promise.all([getMyTasks(), getUsers()]);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold">Tasks</h1>
      <TaskList tasks={tasks} />
      <TaskForm users={users} />
    </div>
  );
}
