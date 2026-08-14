import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl">Legal entities</h2>
        <p className="text-sm text-muted-foreground">
          {legalEntities.length} entities
        </p>
      </div>

      <Card className="py-4">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Short code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="pr-4">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legalEntities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="pl-4 font-medium">
                    {entity.shortCode}
                  </TableCell>
                  <TableCell>{entity.nameEn}</TableCell>
                  <TableCell>{entity.jurisdiction}</TableCell>
                  <TableCell>{entity.defaultCurrency}</TableCell>
                  <TableCell className="pr-4">
                    {entity.isActive ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
