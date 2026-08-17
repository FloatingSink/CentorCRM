import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/date";
import { auth } from "@/lib/auth";
import { getLoginHistory } from "@/server/login-event";
import { getUserPresence } from "@/server/users";

export default async function AdminPage() {
  // Page-level UX guard — defense in depth alongside the (app) layout's
  // signed-in check, same layered pattern, one role tighter. The real
  // boundary is requireAdmin() inside getUserPresence()/getLoginHistory().
  const session = await auth();
  if (session?.user.role !== "admin") {
    redirect("/");
  }

  const [users, logins] = await Promise.all([
    getUserPresence(),
    getLoginHistory(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold">Admin</h1>

      <Card>
        <CardHeader>
          <CardTitle>Who&apos;s online</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name ?? u.email}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>
                    {!u.isActive ? (
                      <Badge variant="outline">Deactivated</Badge>
                    ) : u.isOnline ? (
                      <Badge>Online</Badge>
                    ) : (
                      <Badge variant="secondary">Offline</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent logins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Signed in at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logins.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.userName ?? entry.userEmail}</TableCell>
                  <TableCell>{formatDateTime(entry.occurredAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
