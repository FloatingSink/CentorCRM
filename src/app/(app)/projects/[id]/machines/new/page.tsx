import { createMachineAction } from "../actions";
import { MachineForm } from "../machine-form";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewMachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const { id } = await params;

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "machine.new")}</h2>
      <MachineForm
        action={createMachineAction.bind(null, id)}
        mode="create"
        submitLabel="machine.create"
      />
    </div>
  );
}
