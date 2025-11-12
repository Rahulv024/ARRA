import RecipeGrid from "@/components/search/RecipeGrid";
import { searchRecipes, similarRecipesDetailed } from "@/server/spoonacular";

type Recipe = any;

async function callOpenAI({ apiKey, model, prompt }: { apiKey: string; model: string; prompt: string }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`openai_${res.status}`);
  const data = await res.json();
  try {
    return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return {} as any;
  }
}

async function callAnthropic({ apiKey, model, prompt }: { apiKey: string; model: string; prompt: string }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content:
            prompt +
            "\n\nReturn only JSON matching { \"queries\": [ { \"query\": \"\" } ] }.",
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`anthropic_${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {} as any;
  }
}

export default async function RelatedRecipes({ recipe }: { recipe: Recipe }) {
  const rid = Number(recipe?.id || recipe?.spoonacularId);
  const title = recipe?.title || "";
  const cuisines = Array.isArray(recipe?.cuisines) ? recipe.cuisines : [];
  const diets = Array.isArray(recipe?.diets) ? recipe.diets : [];
  const ingNames = Array.isArray(recipe?.extendedIngredients)
    ? recipe.extendedIngredients.map((i: any) => i?.name).filter(Boolean)
    : Array.isArray(recipe?.ingredients)
    ? recipe.ingredients.map((i: any) => i?.name).filter(Boolean)
    : [];

  // Env/provider selection (reuse pattern from recommendations route)
  const env = process.env as Record<string, string | undefined>;
  const pick = (...keys: string[]) => keys.map((k) => env[k]).find((v) => typeof v === "string" && v.length > 0) || "";
  let provider = (pick("RECS_PROVIDER", "LLM_PROVIDER") || "openai").toLowerCase();
  let apiKey = pick("RECS_API_KEY", "LLM_API_KEY");
  const model = pick("RECS_MODEL", "LLM_MODEL") || (provider === "anthropic" ? "claude-3-5-sonnet-20240620" : "gpt-4o-mini");

  const prompt = `You are assisting a cooking app. Recommend 2-3 highly similar recipe search ideas given a base recipe. Keep the cuisine, diet, core technique, and key flavors aligned; vary toppings or minor ingredients only.
Base recipe: ${title}
Cuisines: ${cuisines.join(", ") || "-"}
Diets: ${diets.join(", ") || "-"}
Key ingredients: ${ingNames.slice(0, 12).join(", ") || "-"}
Return only JSON: { "queries": [ { "query": string }, { "query": string }, { "query": string } ] }.`;

  let results: any[] = [];
  try {
    let queries: Array<{ query: string }> = [];
    if (provider === "openai" && apiKey) {
      const j = await callOpenAI({ apiKey, model, prompt });
      if (Array.isArray(j?.queries)) queries = j.queries.slice(0, 3);
    } else if (provider === "anthropic" && apiKey) {
      const j = await callAnthropic({ apiKey, model, prompt });
      if (Array.isArray(j?.queries)) queries = j.queries.slice(0, 3);
    }

    if (queries.length) {
      const batches = await Promise.allSettled(
        queries.map((q) =>
          searchRecipes({ query: q.query, number: 8 })
        )
      );
      const merged: any[] = [];
      const seen = new Set<number>([rid]);
      for (const b of batches) {
        if (b.status === "fulfilled" && Array.isArray(b.value)) {
          for (const r of b.value) {
            const id = Number(r?.id);
            if (!Number.isNaN(id) && !seen.has(id)) { seen.add(id); merged.push(r); }
            if (merged.length >= 6) break;
          }
        }
        if (merged.length >= 6) break;
      }
      results = merged.slice(0, 4);
    }

    if (!results.length && Number.isFinite(rid)) {
      results = await similarRecipesDetailed(rid, 4);
    }
  } catch {
    if (Number.isFinite(rid)) {
      try { results = await similarRecipesDetailed(rid, 4); } catch {}
    }
  }

  if (!results.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mb-2">You may also like</h2>
      <RecipeGrid results={results} />
    </section>
  );
}

