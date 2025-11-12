"use client";
import RecipeCard from "./RecipeCard";

export default function RecipeGrid({ results, onView }: { results: any[]; onView?: (id: number) => void }) {
  const handleView = onView ?? (() => {});
  return (
    <div className="grid-cards">
      {results.map((item) => (
        <RecipeCard key={item.id} item={item} onView={handleView} />
      ))}
    </div>
  );
}
