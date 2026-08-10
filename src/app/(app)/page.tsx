import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLegalEntities } from "@/server/legal-entities";

export default async function HomePage() {
  const legalEntities = await getLegalEntities();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Legal entities</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Jurisdiction</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legalEntities.map((entity) => (
            <TableRow key={entity.id}>
              <TableCell className="font-medium">{entity.shortCode}</TableCell>
              <TableCell>{entity.nameEn}</TableCell>
              <TableCell>{entity.jurisdiction}</TableCell>
              <TableCell>{entity.defaultCurrency}</TableCell>
              <TableCell>{entity.isActive ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
