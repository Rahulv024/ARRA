"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AddToListButton({ ingredients, recipeTitle }: { ingredients: any[]; recipeTitle?: string }) {
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const can = status === "authenticated";

  async function add() {
    if (!can || busy) return;
    setBusy(true);
    setDone(false);
    try {
      const res = await fetch("/api/user/shoppinglist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listName: recipeTitle ? `${recipeTitle}` : "My List",
          items: ingredients?.map((ing: any) => ({
            name: ing.name || ing.original || ing.title || "Item",
            amount: typeof ing.amount === "number" ? ing.amount : ing.measures?.us?.amount,
            unit: ing.unit || ing.measures?.us?.unitShort || null,
            meta: { original: ing.original || null },
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      alert("Could not add to shopping list. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={add}
      disabled={!can || busy}
      className={`btn ${done ? "bg-emerald-600 text-white border-emerald-600" : ""}`}
      title={can ? "Add all ingredients to a shopping list" : "Sign in to use shopping lists"}
    >
      {busy ? "Adding..." : done ? "Added" : "Add to list"}
    </button>
  );
}

