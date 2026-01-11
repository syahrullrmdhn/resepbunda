// src/types/recipe.ts
export interface Recipe {
  id: number;
  title: string;
  description: string;
  creator: string;
  creatorType: string;
  cookingTime: string;
  category: string;
  isPrivate: 0 | 1;
  // Derived per-user flag: computed from saved_recipes (join table)
  // Not persisted in recipes table; optional for UI convenience
  isFavorite?: 0 | 1;
  rating: number;
  calories: string;
  ingredients: string; // JSON stringified array
  steps: string; // JSON stringified array
  image?: string; // local image URI or null
}

export interface Category {
  id: string;
  name: string;
}
