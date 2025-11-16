import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { openai } from "@/lib/openaiClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const { id } = req.query;

  try {
    // 1) DB에서 원본 이미지 + AI 이미지 불러오기
    const { data: monster, error: fetchError } = await supabaseServer
      .from("monsters")
      .select("original_image_url, ai_image_url")
      .eq("id", id)
      .single();

    if (fetchError || !monster) {
      console.error(fetchError);
      return res.status(404).json({ error: "Monster not found" });
    }

    const { original_image_url, ai_image_url } = monster;

    // 2) GPT에 몬스터 정보 생성 요청
    const prompt = `
You are an expert children's monster encyclopedia creator.

Based on the child's drawing and the AI-generated monster image:

Original Drawing: ${original_image_url}
AI Image: ${ai_image_url}

Generate the following information in JSON:

{
  "monster_name": string,  
  "description": string,     
  "traits": string           
}

Rules:
- Make the monster name unique, cute, and kid-friendly.
- Description should be 1~2 sentences, simple enough for a 6-year-old.
- Traits is a short summary of personality or special ability.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message?.content || "";
    
    let result: any;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", text);
      return res.status(500).json({ error: "Failed to parse GPT output", raw: text });
    }

    // 3) DB 업데이트
    const { error: updateError } = await supabaseServer
      .from("monsters")
      .update({
        monster_name: result.monster_name,
        description: result.description,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update Error:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: "Monster info generated!",
      monster_name: result.monster_name,
      description: result.description,
      traits: result.traits,
    });

  } catch (err: any) {
    console.error("AI INFO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
