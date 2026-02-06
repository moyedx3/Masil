import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function fix() {
  const keepId = "eb1189a0-917b-4528-9292-76f0c3800e39";
  const deleteId = "09038f8c-9dde-43dd-8516-b6b531edd5e9";

  // 1. Move reviews from duplicate to keeper
  const { error: e1 } = await supabase
    .from("reviews")
    .update({ place_id: keepId })
    .eq("place_id", deleteId);
  if (e1) { console.error("Move reviews error:", e1); return; }
  console.log("1. Moved reviews to kept place");

  // 2. Delete duplicate place (frees up google_place_id)
  const { error: e2 } = await supabase
    .from("places")
    .delete()
    .eq("id", deleteId);
  if (e2) { console.error("Delete duplicate error:", e2); return; }
  console.log("2. Deleted duplicate place");

  // 3. Now set google_place_id on keeper
  const { error: e3 } = await supabase
    .from("places")
    .update({ google_place_id: "ChIJkxXZMgyjfDURmnO58-wOW0w" })
    .eq("id", keepId);
  if (e3) { console.error("Update place error:", e3); return; }
  console.log("3. Updated kept place with google_place_id");

  // 4. Check Frank Burger duplicates
  const { data: franks } = await supabase
    .from("places")
    .select("id, name, google_place_id")
    .ilike("name", "%Frank%");
  console.log("Frank Burger entries:", JSON.stringify(franks, null, 2));

  if (franks && franks.length > 1) {
    const keep = franks[0];
    const dupes = franks.slice(1);
    for (const dupe of dupes) {
      await supabase.from("reviews").update({ place_id: keep.id }).eq("place_id", dupe.id);
      await supabase.from("places").delete().eq("id", dupe.id);
      console.log(`Fixed Frank Burger duplicate: removed ${dupe.id}`);
      if (dupe.google_place_id && !keep.google_place_id) {
        await supabase.from("places").update({ google_place_id: dupe.google_place_id }).eq("id", keep.id);
      }
    }
  }

  // 5. Verify NOUDIT
  const { data: noudit } = await supabase
    .from("places")
    .select("id, name, name_korean, google_place_id")
    .eq("id", keepId)
    .single();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, content, original_author, source")
    .eq("place_id", keepId);
  console.log("\nFinal NOUDIT Ikseon:", JSON.stringify(noudit, null, 2));
  console.log("Reviews:", JSON.stringify(reviews, null, 2));
}

fix().catch(console.error);
