import { getAllGroups, isDatabaseAvailable } from "@moneyforward-daily-action/db";
import { notFound } from "next/navigation";

export default async function GroupLayout({ children, params }: LayoutProps<"/[groupId]">) {
  if (!isDatabaseAvailable()) return <>{children}</>;

  const { groupId } = await params;
  const groups = await getAllGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    notFound();
  }

  return <>{children}</>;
}
