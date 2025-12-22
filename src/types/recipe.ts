// src/types/recipe.ts
export interface Recipe {
  id: number;
  title: string;
  description: string;
  creator: string;
  creatorEmail?: string;
  creatorType: string;
  cookingTime: string;
  category: string;
  isPrivate: 0 | 1;
  rating: number;
  calories: string;
  ingredients: string; // JSON stringified array
  steps: string; // JSON stringified array
}

export interface Category {
  id: string;
  name: string;
}
