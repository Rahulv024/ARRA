import { NextResponse } from "next/server";

type Suggestion = { for: string; alt: string; note: string };

function fallbackSubs(miss: string): Suggestion[] {
  const m = miss.toLowerCase();
  const top3 = (arr: Suggestion[]) => arr.slice(0, 3);
  const table: Array<[RegExp, Suggestion[]]> = [
    [/milk|whole milk|dairy/, [
      { for: miss, alt: "unsweetened almond milk", note: "1:1; add 1 tsp oil per cup for richness" },
      { for: miss, alt: "oat milk", note: "1:1; neutral flavor" },
      { for: miss, alt: "evaporated milk + water", note: "1:1 by volume with water" },
    ]],
    [/butter/, [
      { for: miss, alt: "olive oil", note: "Use 3/4 cup oil for each 1 cup butter in cooking" },
      { for: miss, alt: "coconut oil", note: "1:1; solid at room temp for pastries" },
      { for: miss, alt: "margarine", note: "1:1; baking sticks preferred" },
    ]],
    [/egg/, [
      { for: miss, alt: "flax egg", note: "1 tbsp flax + 3 tbsp water = 1 egg (binder)" },
      { for: miss, alt: "applesauce", note: "1/4 cup per egg in cakes and muffins" },
      { for: miss, alt: "silken tofu", note: "1/4 cup blended per egg" },
    ]],
    [/cream|heavy cream/, [
      { for: miss, alt: "half-and-half", note: "1:1 for soups and sauces" },
      { for: miss, alt: "evaporated milk", note: "3/4 cup evap + 1/4 cup oil ~ 1 cup cream" },
      { for: miss, alt: "cashew cream", note: "Blend 1/2 cup soaked cashews + 1/2 cup water" },
    ]],
  ];
  for (const [re, arr] of table) if (re.test(m)) return top3(arr);
  return top3([
    { for: miss, alt: "closest flavor match", note: "Swap with similar profile (e.g., shallot for onion)" },
    { for: miss, alt: "textural stand-in", note: "Match texture and moisture; adjust liquid" },
    { for: miss, alt: "acid/salt balance", note: "Add lemon or vinegar; use soy or fish sauce sparingly" },
  ]);
}

async function callOpenAI({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<{ suggestions: Suggestion[] } | { rateLimited: true }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) return { rateLimited: true } as const;
  if (!res.ok) throw new Error(`openai_${res.status}`);
  const data = await res.json();
  let parsed: any = {};
  try {
    parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
  } catch {}
  return { suggestions: parsed?.suggestions } as any;
}

async function callAnthropic({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<{ suggestions: Suggestion[] } | { rateLimited: true }> {
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
          content: prompt +
            "\n\nReturn only JSON matching { \"suggestions\": [ { \"for\": \"\", \"alt\": \"\", \"note\": \"\" } ] }.",
        },
      ],
    }),
  });
  if (res.status === 429) return { rateLimited: true } as const;
  if (!res.ok) throw new Error(`anthropic_${res.status}`);
  const data = await res.json();
  let contentText = "";
  try {
    contentText = data?.content?.[0]?.text ?? "";
  } catch {}
  let parsed: any = {};
  try {
    parsed = JSON.parse(contentText || "{}");
  } catch {}
  return { suggestions: parsed?.suggestions } as any;
}

// I integrate with Gemini (Google Generative Language API)
// Docs for reference: https://ai.google.dev/gemini-api/docs
async function callGemini({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string; // e.g., "gemini-1.5-flash"
  prompt: string;
}): Promise<{ suggestions: Suggestion[] } | { rateLimited: true }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              prompt +
              "\n\nReturn only JSON matching { \"suggestions\": [ { \"for\": \"\", \"alt\": \"\", \"note\": \"\" } ] }.",
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.3 },
  } as any;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) return { rateLimited: true } as const;
  if (!res.ok) throw new Error(`gemini_${res.status}`);

  const data = await res.json();
  // Response typically in candidates[0].content.parts[0].text
  let text = "";
  try {
    text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch {}
  let parsed: any = {};
  try {
    parsed = JSON.parse(text || "{}");
  } catch {}
  return { suggestions: parsed?.suggestions } as any;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const missing = String(body?.missing ?? "").trim();
  const ingredients = Array.isArray(body?.ingredients) ? body.ingredients : [];
  const diet = typeof body?.diet === "string" ? body.diet : undefined;

  if (!missing) return NextResponse.json({ error: "missing is required" }, { status: 400 });

  // I read per‑feature LLM configuration with an optional fallback provider.
  // I also accept multiple env var spellings (uppercase/lowercase) and a common typo.
  const env = process.env as Record<string, string | undefined>;
  const pick = (...keys: string[]) => keys.map((k) => env[k]).find((v) => typeof v === "string" && v.length > 0) || "";

  // Primary configuration I try first
  let pPrimary = (pick("SUBS_PROVIDER", "SUB_PROVIDER", "sub_provider", "LLM_PROVIDER") || "").toLowerCase();
  let keyPrimary = pick("SUBS_API_KEY", "SUBS_KEY", "sub_api_key", "sub_key", "LLM_API_KEY");
  const modelPrimary =
    pick("SUBS_MODEL", "sub_model", "LLM_MODEL") ||
    (pPrimary === "anthropic"
      ? "claude-3-5-sonnet-20240620"
      : pPrimary === "gemini"
      ? "gemini-1.5-flash"
      : "gpt-4o-mini");

  // Small heuristic: if someone mistakenly puts an API key into `sub_provider`, I treat it as an OpenAI key.
  if (!keyPrimary) {
    const maybeKey = env["sub_provider"] || env["SUB_PROVIDER"];
    if (maybeKey && /^(sk-|sk-proj-)/i.test(maybeKey)) {
      keyPrimary = maybeKey;
      if (!pPrimary) pPrimary = "openai";
    }
  }

  // Fallback configuration I try after primary
  const pFallback = (pick("SUBS_FALLBACK_PROVIDER", "subs_fallback_provider") || "").toLowerCase();
  const keyFallback = pick("SUBS_FALLBACK_API_KEY", "subs_fallback_api_key");
  const modelFallback =
    pick("SUBS_FALLBACK_MODEL", "subs_fallback_model") ||
    (pFallback === "anthropic"
      ? "claude-3-5-sonnet-20240620"
      : pFallback === "gemini"
      ? "gemini-1.5-flash"
      : "gpt-4o-mini");

  const prompt = `You are a culinary expert. Suggest exactly 3 practical substitutes for the ingredient "${missing}" in a recipe.
Existing ingredients: ${ingredients.map((i: any) => i?.name).filter(Boolean).join(", ") || "unknown"}
Dietary constraints: ${diet || "none"}
Each suggestion must include { for: "${missing}", alt: "name of substitute", note: "short usage note" }.
Return only JSON with shape: { "suggestions": [ { "for": "", "alt": "", "note": "" }, { ... }, { ... } ] }`;

  // I normalize and validate the model output here
  const normalize = (arr: any): Suggestion[] | null => {
    if (!Array.isArray(arr)) return null;
    const take = arr
      .slice(0, 3)
      .map((s: any) => ({ for: s?.for || missing, alt: s?.alt || "", note: s?.note || "" }))
      .filter((s: Suggestion) => s.alt);
    if (take.length !== 3) return null;
    return take;
  };

  const tryProvider = async (provider: string, key: string, model: string) => {
    if (!provider || !key) return { ok: false as const };
    if (provider === "openai") {
      const r = await callOpenAI({ apiKey: key, model, prompt });
      if ("rateLimited" in r) return { ok: false as const, rateLimited: true as const };
      const n = normalize((r as any).suggestions);
      if (!n) throw new Error("openai_parse");
      return { ok: true as const, provider: "openai", suggestions: n };
    }
    if (provider === "anthropic") {
      const r = await callAnthropic({ apiKey: key, model, prompt });
      if ("rateLimited" in r) return { ok: false as const, rateLimited: true as const };
      const n = normalize((r as any).suggestions);
      if (!n) throw new Error("anthropic_parse");
      return { ok: true as const, provider: "anthropic", suggestions: n };
    }
    if (provider === "gemini") {
      const r = await callGemini({ apiKey: key, model, prompt });
      if ("rateLimited" in r) return { ok: false as const, rateLimited: true as const };
      const n = normalize((r as any).suggestions);
      if (!n) throw new Error("gemini_parse");
      return { ok: true as const, provider: "gemini", suggestions: n };
    }
    throw new Error("unsupported_provider");
  };

  try {
    // I first try the primary provider
    const primary = await tryProvider(pPrimary, keyPrimary, modelPrimary);
    if (primary.ok) return NextResponse.json({ source: primary.provider, suggestions: primary.suggestions });

    // If rate limited or unavailable, I attempt the configured fallback provider
    if (pFallback && keyFallback) {
      const secondary = await tryProvider(pFallback, keyFallback, modelFallback);
      if (secondary.ok) return NextResponse.json({ source: secondary.provider, suggestions: secondary.suggestions });
    }

    // If nothing worked, I return deterministic suggestions so the UX stays smooth
    return NextResponse.json({ source: "fallback", suggestions: fallbackSubs(missing) });
  } catch (e) {
    // On any unexpected failure, I still serve deterministic suggestions
    return NextResponse.json({ source: "fallback", suggestions: fallbackSubs(missing) });
  }
}
