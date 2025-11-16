import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { openai } from "@/lib/openaiClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const { id } = req.query;
  const { childName } = req.body;

  try {
    const { data: monster, error } = await supabaseServer
      .from("monsters")
      .select("monster_name, description, ai_image_url")
      .eq("id", id)
      .single();

    if (error || !monster)
      return res.status(404).json({ error: "Monster not found" });

    const prompt = `
You are a children's storyteller.

Create a short, warm, exciting story about a child and a monster.

Child name: ${childName}
Monster name: ${monster.monster_name}
Monster description: ${monster.description}

Constraints:
- Write in Korean
- 8~12 sentences
- Easy enough for a 6-year-old to understand
- Friendly, heartwarming, adventurous tone
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }]
    });

    const story = completion.choices[0].message?.content || "";

    await supabaseServer
      .from("monsters")
      .update({ story })
      .eq("id", id);

    return res.status(200).json({ message: "Story generated!", story });
  } catch (err: any) {
    console.error("STORY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
