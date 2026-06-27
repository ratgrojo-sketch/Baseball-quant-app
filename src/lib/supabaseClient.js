// ─────────────────────────────────────────────────────────────────────────────
// supabaseClient.js
// Inactivo en Fase 1 (localStorage). Se activa en Fase 2.
//
// INSTRUCCIONES DE ACTIVACIÓN (Fase 2):
//   1. npm install @supabase/supabase-js
//   2. Crea .env en la raíz del proyecto con:
//        VITE_SUPABASE_URL=https://xxxx.supabase.co
//        VITE_SUPABASE_ANON_KEY=eyJ...
//   3. Descomenta las líneas de import y createClient abajo.
//   4. Borra la exportación del stub (mock) al final del archivo.
// ─────────────────────────────────────────────────────────────────────────────

// ── FASE 2: Descomenta esto cuando tengas tus credenciales ───
// import { createClient } from "@supabase/supabase-js";
//
// const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
//
// if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//   throw new Error(
//     "Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env"
//   );
// }
//
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth:     { persistSession: true },
//   realtime: { params: { eventsPerSecond: 2 } },
// });

// ── FASE 1: Stub — no hace nada, evita errores de import ─────
export const supabase = null;

// ── Connection test helper (use in main.jsx during Fase 2) ───
export async function testSupabaseConnection() {
  if (!supabase) {
    console.info("[Supabase] Client not initialized — running in localStorage mode");
    return { connected: false, mode: "localStorage" };
  }
  try {
    const { data, error } = await supabase.from("teams").select("team_id").limit(1);
    if (error) throw error;
    console.info("[Supabase] Connection OK ✓", data);
    return { connected: true, mode: "supabase" };
  } catch (e) {
    console.error("[Supabase] Connection failed:", e.message);
    return { connected: false, mode: "error", error: e.message };
  }
}
