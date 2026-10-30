// Adapter used by React; installed at the original bootstrap point.
function installKidsBadgesBridge() {
window.kidsBadgesBridge = {
  getUserId: () => supabaseUser?.id || null,
  async load() {
    const userId = supabaseUser?.id;
    if (!supabaseClient || !userId) return [];
    const { data, error } = await supabaseClient.from("user_app_state")
      .select("state_key,payload").eq("user_id", userId).like("state_key", "kids.badge.v1.%");
    if (error) throw error;
    return (data || []).filter(row => row.state_key === `kids.badge.v1.${row.payload?.adventureId}`).map(row => row.payload);
  },
  async save(adventureId, earnedAt) {
    const userId = supabaseUser?.id;
    if (!supabaseClient || !userId) throw new Error("Sign in to save badges.");
    const { error } = await supabaseClient.from("user_app_state").upsert({
      user_id: userId, state_key: `kids.badge.v1.${adventureId}`,
      payload: { adventureId, earnedAt }, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,state_key", ignoreDuplicates: true });
    if (error) throw error;
  },
};
}
