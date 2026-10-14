// Compatibility path for databases that do not yet have unpray_for_request.
export async function cancelPrayer(admin, requestId, userId) {
  const { data: removed, error: removalError } = await admin.from("prayer_interactions")
    .delete().eq("request_id", requestId).eq("user_id", userId).select("id");
  if (removalError) throw removalError;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: request, error } = await admin.from("prayer_requests")
      .select("prayer_count").eq("id", requestId).single();
    if (error) throw error;
    if (!removed?.length) return request.prayer_count;
    const count = Math.max(0, request.prayer_count - 1);
    // Compare-and-set preserves prayers recorded by other users concurrently.
    const { data: updated, error: updateError } = await admin.from("prayer_requests")
      .update({ prayer_count: count, updated_at: new Date().toISOString() })
      .eq("id", requestId).eq("prayer_count", request.prayer_count).select("prayer_count");
    if (updateError) throw updateError;
    if (updated?.length) return updated[0].prayer_count;
  }
  throw new Error("The prayer counter is busy. Please refresh the prayer wall.");
}
