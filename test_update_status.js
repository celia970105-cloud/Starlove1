import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://monzjuezyncvdlzqgqmo.supabase.co/";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("--- Simulating post status update ---");

  console.log("1. Reading posts from table...");
  const { data: posts, error: selectError } = await supabase
    .from("posts")
    .select("*");

  if (selectError) {
    console.error("Select Error:", selectError);
    return;
  }
  console.log("Posts currently in DB:", JSON.stringify(posts, null, 2));

  if (posts.length === 0) {
    console.log("No posts found to update.");
    return;
  }

  const firstPost = posts[0];
  console.log(`2. Updating post [${firstPost.id}] status to 'approved'...`);
  
  const { data: updateData, error: updateError } = await supabase
    .from("posts")
    .update({ status: "approved" })
    .eq("id", firstPost.id)
    .select();

  if (updateError) {
    console.error("❌ Update Error:", updateError);
  } else {
    console.log("✅ Update Success!", JSON.stringify(updateData, null, 2));
  }

  console.log("3. Re-reading posts to see if it shows as approved...");
  const { data: finalPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("id", firstPost.id);
  console.log("Resulting record:", JSON.stringify(finalPosts, null, 2));
}

run();
