export interface Recipe {
  id: number;
  title: string;
  description: string;
  creator: string;
  creatorType: string;
  cookingTime: string;
  difficulty: "Easy" | "Medium" | "Hard"; // BARU
  status: "Draft" | "Published"; // BARU
  category: string;
  isPrivate: 0 | 1;
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
