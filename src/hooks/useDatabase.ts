import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { initDb } from "../services/db"; // Import dari folder db

export function useDatabase() {
  const [isDbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function loadDataAsync() {
      try {
        // Tahan splash screen agar tidak close sebelum DB siap
        await SplashScreen.preventAutoHideAsync();

        console.log("Initializing database...");

        // Panggil fungsi initDb yang ada logic reset-nya
        await initDb();

        setDbReady(true);
        console.log("Database is ready.");
      } catch (e) {
        console.error("Failed to initialize database", e);
      } finally {
        // Sembunyikan splash screen
        if (isDbReady) {
          await SplashScreen.hideAsync();
        }
      }
    }

    loadDataAsync();
  }, [isDbReady]);

  return isDbReady;
}
