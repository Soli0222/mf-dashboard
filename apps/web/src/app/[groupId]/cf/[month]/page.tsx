import type { Metadata } from "next";
import { formatMonth } from "../../../../lib/format";
import { CFMonthContent } from "../../../cf/[month]/page";

export async function generateMetadata({
  params,
}: PageProps<"/[groupId]/cf/[month]">): Promise<Metadata> {
  const { month } = await params;
  return {
    title: `収支 - ${formatMonth(month)}`,
  };
}

export default async function GroupCFMonthPage({ params }: PageProps<"/[groupId]/cf/[month]">) {
  const { groupId, month } = await params;

  return <CFMonthContent month={month} groupId={groupId} />;
}
