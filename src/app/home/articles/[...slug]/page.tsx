import type { Metadata } from "next";
import { ArticleResourceView } from "../resource-view";

type Params = Promise<{ slug: string[] }>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;

  return { title: slug.at(-1) || "Articles" };
}

const ArticleSlugPage = async ({
  params,
}: {
  params: Params;
}) => {
  const { slug } = await params;
  return <ArticleResourceView pathSegments={slug} />;
};

export default ArticleSlugPage;