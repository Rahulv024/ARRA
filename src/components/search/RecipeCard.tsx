"use client";

import FavoriteButton from "./FavoriteButton";
import Link from "next/link";

export default function RecipeCard({ item, onView }: { item: any; onView: (id: number) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.title}
          className="h-44 w-full object-cover"
        />
        <div className="absolute right-2 top-2">
          <FavoriteButton item={item} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold">{item.title}</h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {item.readyInMinutes ? `${item.readyInMinutes} min` : ""}{item.servings ? ` - ${item.servings} servings` : ""}

        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {(item.diets || []).slice(0, 2).map((d: string) => (
            <span key={d} className="badge">{d}</span>
          ))}
          {(item.cuisines || []).slice(0, 1).map((c: string) => (
            <span key={c} className="badge">{c}</span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Link className="btn primary" href={`/recipe/${item.id}`}>View</Link>
          {typeof item?.avgRating === 'number' && item?.ratingCount > 0 && (
            <div className="ml-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 dark:border-zinc-800">
              <span>{item.avgRating.toFixed(1)}</span>
              <span aria-hidden>★</span>
              <span>({item.ratingCount})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



