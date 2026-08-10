import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMachineAction } from "../actions";
import { MachineForm } from "../machine-form";
import { getMachineById } from "@/server/machines";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string; machineId: string }>;
}) {
  const { id, machineId } = await params;
  const result = await getMachineById(machineId);
  if (!result) {
    notFound();
  }

  const { machine, project } = result;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">{machine.designation}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        <Link href={`/projects/${id}`} className="hover:underline">
          {project.nameEn}
        </Link>
      </p>
      <MachineForm
        action={updateMachineAction.bind(null, machineId, id)}
        defaultValues={{
          designation: machine.designation,
          manufacturer: machine.manufacturer,
          diameterMm: machine.diameterMm,
          machineType: machine.machineType,
          notes: machine.notes,
          isActive: machine.isActive,
        }}
        mode="edit"
        submitLabel="Save changes"
      />
    </div>
  );
}
