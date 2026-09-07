"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation";

const TYPES = new Set(["announcement", "update", "maintenance"]);

export async function createNewsPost(formData: FormData) {
  const admin = await requireAdminRole("ADMIN");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const postType = String(formData.get("postType") ?? "announcement");
  const isPublished = String(formData.get("isPublished") ?? "true") === "true";
  if (title.length < 3 || body.length < 3 || !TYPES.has(postType)) return;

  const db = createAdminClient();
  const { error } = await db.from("news_posts").insert({
    title,
    body,
    created_by: admin.id,
    post_type: postType,
    is_published: isPublished,
  });
  if (error) throw new Error("Unable to publish announcement.");
  await db.from("admin_audit_logs").insert({
    actor_id: admin.id,
    action: isPublished ? "news_publish" : "news_draft",
    entity_type: "news_post",
    entity_id: null,
    metadata: { title, post_type: postType },
  });
  revalidatePath("/news");
  revalidatePath("/admin/news");
}

export async function updateNewsPost(formData: FormData) {
  const admin = await requireAdminRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const postType = String(formData.get("postType") ?? "announcement");
  const isPublished = String(formData.get("isPublished") ?? "true") === "true";
  if (!isUuid(id) || title.length < 3 || body.length < 3 || !TYPES.has(postType)) return;

  const db = createAdminClient();
  const { error } = await db.from("news_posts").update({ title, body, post_type: postType, is_published: isPublished, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error("Unable to update announcement.");
  await db.from("admin_audit_logs").insert({ actor_id: admin.id, action: isPublished ? "news_update_publish" : "news_update_draft", entity_type: "news_post", entity_id: id, metadata: { title, post_type: postType } });
  revalidatePath("/news");
  revalidatePath("/admin/news");
}

export async function deleteNewsPost(formData: FormData) {
  const admin = await requireAdminRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  const db = createAdminClient();
  const { data: post } = await db.from("news_posts").select("id,title").eq("id", id).maybeSingle();
  if (!post) return;
  const { error } = await db.from("news_posts").delete().eq("id", id);
  if (error) throw new Error("Unable to remove announcement.");
  await db.from("admin_audit_logs").insert({ actor_id: admin.id, action: "news_delete", entity_type: "news_post", entity_id: id, metadata: { title: post.title } });
  revalidatePath("/news");
  revalidatePath("/admin/news");
}
