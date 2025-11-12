import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SearchSection from "@/components/search/SearchSection";
import TrendingPopular from "@/components/home/TrendingPopular";
import IngredientSpotlight from "@/components/home/IngredientSpotlight";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div>
      <SearchSection />
      {/* I replace generic recommendations with Trending/Popular and Spotlight */}
      {/* These are server components rendered below the search UI */}
      {/* I source popularity via Spoonacular and top rated via local reviews */}
      {/* I show an ingredient of the day for discovery */}
      {/* I omit sections when they have no data */}
      {/* These server components fetch on the server and stream HTML to the client */}
      {/* I keep them lightweight for fast loads */}
      {/* Trending & Popular */}
      {/* Top Rated This Week */}
      <TrendingPopular />
      {/* Ingredient Spotlight */}
      <IngredientSpotlight />
    </div>
  );
}
