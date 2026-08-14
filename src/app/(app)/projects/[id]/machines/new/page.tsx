import { createMachineAction } from "../actions";
import { MachineForm } from "../machine-form";

export default async function NewMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h2 className="mb-4 text-2xl">New machine</h2>
      <MachineForm
        action={createMachineAction.bind(null, id)}
        mode="create"
        submitLabel="Create machine"
      />
    </div>
  );
}
