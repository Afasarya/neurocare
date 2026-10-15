import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const privateHealthHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function authenticatedHealthUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { status: "not_configured" as const };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated" as const };
  return { status: "authenticated" as const, user: data.user, supabase };
}

export async function readHealthJson(request: Request, maxBytes = 16 * 1024): Promise<unknown | "too_large" | "invalid_json"> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes || !request.body) return contentLength > maxBytes ? "too_large" : "invalid_json";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); return "too_large"; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; } catch { return "invalid_json"; }
}

export function healthApiError(status: number, requestId: string, code: string, message: string) {
  return Response.json({ error: { code, message }, meta: { requestId } }, { status, headers: privateHealthHeaders });
}

export function unavailableMeta(requestId: string) {
  return { requestId, generatedAt: new Date().toISOString(), timezone: "Asia/Jakarta" as const, demo: false };
}
