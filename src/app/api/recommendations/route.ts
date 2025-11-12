import { NextResponse } from "next/server";
import { searchRecipes } from "@/server/spoonacular";

type SuggestQuery = { query: string; cuisine?: string; diet?: string; maxTime?: number };

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
            "\n\nReturn only JSON matching { \"queries\": [ { \"query\": \"\", \"cuisine\": \"?\", \"diet\": \"?\", \"maxTime\": 0 } ] }.",
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const diet = searchParams.get("diet") || undefined;
  const cuisine = searchParams.get("cuisine") || undefined;
  const maxTime = searchParams.get("maxTime") ? Number(searchParams.get("maxTime")) : undefined;

  if (!q) return NextResponse.json({ results: [] });

  // I read per‑feature configuration: I prefer RECS_* and fall back to LLM_*
  const env = process.env as Record<string, string | undefined>;
  const pick = (...keys: string[]) => keys.map((k) => env[k]).find((v) => typeof v === "string" && v.length > 0) || "";
  let provider = (pick("RECS_PROVIDER", "LLM_PROVIDER") || "openai").toLowerCase();
  let apiKey = pick("RECS_API_KEY", "LLM_API_KEY");
  const model = pick("RECS_MODEL", "LLM_MODEL") || (provider === "anthropic" ? "claude-3-5-sonnet-20240620" : "gpt-4o-mini");

  // I ask the model to generate 2–3 focused searches based on the seed query + filters
  const prompt = `You are assisting a cooking app. Given a user intent and optional filters, output 2-3 high quality recipe search ideas.
Seed intent: ${q}
User filters (optional): diet=${diet || "-"}, cuisine=${cuisine || "-"}, maxTime=${typeof maxTime === "number" ? maxTime : "-"}
Return only JSON: { "queries": [ { "query": string, "cuisine"?: string, "diet"?: string, "maxTime"?: number } ] }.
Keep queries concrete (e.g., 'quick vegetarian pasta', 'protein-rich Indian curry', 'gluten-free tacos').`;

  try {
    let queries: SuggestQuery[] = [];
    if (provider === "openai" && apiKey) {
      const j = await callOpenAI({ apiKey, model, prompt });
      if (Array.isArray(j?.queries)) queries = j.queries.slice(0, 3);
    } else if (provider === "anthropic" && apiKey) {
      const j = await callAnthropic({ apiKey, model, prompt });
      if (Array.isArray(j?.queries)) queries = j.queries.slice(0, 3);
    }

    // If the LLM isn’t configured or fails, I fall back to a single query
    if (!queries.length) queries = [{ query: q, cuisine, diet, maxTime }];

    // I execute the searches and merge unique results
    const batches = await Promise.allSettled(
      queries.map((it) =>
        searchRecipes({
          query: it.query || q,
          diet: diet || it.diet,
          cuisine: cuisine || it.cuisine,
          maxReadyTime: typeof maxTime === "number" ? maxTime : it.maxTime,
          number: 12,
        })
      )
    );
    const merged: any[] = [];
    const seen = new Set<number>();
    for (const b of batches) {
      if (b.status === "fulfilled" && Array.isArray(b.value)) {
        for (const r of b.value) {
          const id = Number(r?.id);
          if (!Number.isNaN(id) && !seen.has(id)) { seen.add(id); merged.push(r); }
          if (merged.length >= 18) break; // cap results
        }
      }
    }
    // If nothing merged (e.g., upstream issues), I do a basic search
    if (!merged.length) {
      const results = await searchRecipes({ query: q, diet, cuisine, maxReadyTime: maxTime, number: 12 });
      return NextResponse.json({ results });
    }
    return NextResponse.json({ results: merged.slice(0, 12) });
  } catch (e) {
    // On any error I fall back to the previous non‑AI behavior
    try {
      const results = await searchRecipes({ query: q, diet, cuisine, maxReadyTime: maxTime, number: 12 });
      return NextResponse.json({ results, fallback: true });
    } catch (e2) {
      const message = (e2 as any)?.message || "Upstream search failed";
      return NextResponse.json({ error: message, results: [] }, { status: 502 });
    }
  }
}
