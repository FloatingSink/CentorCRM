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
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { getActivityLog } from "@/server/audit-log";
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

  const [users, logins, activity, locale] = await Promise.all([
    getUserPresence(),
    getLoginHistory(),
    getActivityLog(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold">{t(locale, "admin.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.whosOnline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(locale, "admin.colUser")}</TableHead>
                <TableHead>{t(locale, "admin.colRole")}</TableHead>
                <TableHead>{t(locale, "admin.colStatus")}</TableHead>
                <TableHead>{t(locale, "admin.colLastActive")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name ?? u.email}</TableCell>
                  <TableCell>{t(locale, `role.${u.role}`)}</TableCell>
                  <TableCell>
                    {!u.isActive ? (
                      <Badge variant="outline">
                        {t(locale, "admin.deactivated")}
                      </Badge>
                    ) : u.isOnline ? (
                      <Badge>{t(locale, "admin.online")}</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t(locale, "admin.offline")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lastActiveAt
                      ? formatDateTime(u.lastActiveAt, locale)
                      : t(locale, "common.never")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.recentLogins")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(locale, "admin.colUser")}</TableHead>
                <TableHead>{t(locale, "admin.colSignedInAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logins.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.userName ?? entry.userEmail}</TableCell>
                  <TableCell>
                    {formatDateTime(entry.occurredAt, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.activityLog")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(locale, "admin.colUser")}</TableHead>
                <TableHead>{t(locale, "admin.colActivity")}</TableHead>
                <TableHead>{t(locale, "admin.colWhen")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.userName ?? entry.userEmail}</TableCell>
                  {/* Audit messages are English prose written into
                    audit_log.message at write time — deliberately not
                    translated, see docs/decisions.md 2026-09-23. */}
                  <TableCell>{entry.message}</TableCell>
                  <TableCell>
                    {formatDateTime(entry.occurredAt, locale)}
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
