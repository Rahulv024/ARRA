/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function Home() {
  return (
    <div className="home-viewport relative h-[100svh] overflow-hidden">
      {/* Full-bleed, single-screen hero (tight top) */}
      <section className="mesh max-w-none h-full px-6 lg:px-10 pt-2 sm:pt-3 flex items-start">
        <div className="mx-auto max-w-screen-2xl w-full grid items-start content-start gap-8 lg:grid-cols-2">
          <div>
            <span className="badge">Smart Recipe Discovery</span>
            <h1 className="mt-1 text-6xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight max-w-[16ch]">
              Find recipes you'll actually cook.
            </h1>
            <p className="mt-3 max-w-2xl text-lg sm:text-xl text-zinc-600 dark:text-zinc-400">
              Natural-language search, dietary filters, personalized recommendations, and one-click shopping lists—beautifully packaged for everyday cooking.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn primary hero-primary h-11 w-full sm:w-auto px-6 text-base">Create account</Link>
              <Link href="/login" className="btn muted h-11 w-full sm:w-auto px-6 text-base">Sign in</Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="badge">Semantic Search</span>
              <span className="badge">Diet & Cuisine Filters</span>
              <span className="badge">AI Recommendations</span>
              <span className="badge">Shopping List</span>
              <span className="badge">Reviews & Ratings</span>
            </div>
          </div>

          <div className="relative">
            <div className="card overflow-hidden border-0 rounded-3xl dark:bg-zinc-900/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?q=80&w=1600&auto=format&fit=crop"
                  alt="Dish preview"
                  className="h-52 md:h-60 lg:h-[22rem] xl:h-[24rem] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent dark:from-zinc-950" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">Creamy Pesto Farfalle</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">25 min • 4 servings • Italian</p>
                  </div>
                  <button className="btn ghost" type="button" aria-label="Favorite">❤</button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60 dark:border-zinc-800">
                    Vegetarian • Low effort
                  </div>
                  <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60 dark:border-zinc-800">
                    520 kcal • 22g protein
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href="/dashboard" className="btn primary">View recipes</Link>
                  <Link href="/dashboard" className="btn muted">Add to shopping</Link>
                </div>
              </div>
            </div>
          </div>
          {/* Benefits row kept compact so everything fits without scrolling */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">Why you'll love it</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="card p-4">
                <div className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Search the way you speak</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  Try "easy low-carb lunch under 15 minutes." Our semantic engine maps intent to results—fast.
                </div>
              </div>
              <div className="card p-4">
                <div className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Personal tastes, respected</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  Save, like, and review recipes. Your feedback trains the personalization engine over time.
                </div>
              </div>
              <div className="card p-4">
                <div className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Cook without friction</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  Step-by-step instructions, nutrition, and one-click shopping lists that follow your plan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
