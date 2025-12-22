// src/services/recipe.ts
import { Recipe } from "../types/recipe";
import { querySql } from "./db/client";

/**
 * Get all public recipes
 */
export async function getAllRecipes(): Promise<Recipe[]> {
    const rows = await querySql<any>("SELECT * FROM recipes WHERE isPrivate = 0");
    return rows as Recipe[];
}

/**
 * Get recipes created by a specific user (by creatorEmail)
 */
export async function getRecipesByCreator(email: string): Promise<Recipe[]> {
    const e = email.trim().toLowerCase();
    const rows = await querySql<any>(
        "SELECT * FROM recipes WHERE LOWER(creatorEmail) = ?",
        [e]
    );
    return rows as Recipe[];
}

/**
 * Get a single recipe by ID
 */
export async function getRecipeById(id: number): Promise<Recipe | null> {
    const rows = await querySql<any>("SELECT * FROM recipes WHERE id = ?", [id]);
    return rows[0] || null;
}
