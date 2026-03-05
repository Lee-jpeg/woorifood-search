import { ArticleCategory, CATEGORY_COLOR, CATEGORY_KO } from "@/types";

export default function CategoryBadge({ category }: { category: ArticleCategory }) {
  return (
    <span className={`badge ${CATEGORY_COLOR[category] ?? "bg-gray-100 text-gray-700"}`}>
      {CATEGORY_KO[category] ?? category}
    </span>
  );
}
