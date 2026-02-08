import type { Metadata } from "next";
import { getAccountByMfId } from "@moneyforward-daily-action/db";
import { AccountDetailContent } from "../../../accounts/[id]/page";

export async function generateMetadata({
  params,
}: PageProps<"/[groupId]/accounts/[id]">): Promise<Metadata> {
  const { id, groupId } = await params;
  const account = await getAccountByMfId(id, groupId);
  return {
    title: account?.name ?? "アカウント詳細",
  };
}

export default async function GroupAccountDetailPage({
  params,
}: PageProps<"/[groupId]/accounts/[id]">) {
  const { groupId, id } = await params;

  return <AccountDetailContent id={id} groupId={groupId} />;
}
