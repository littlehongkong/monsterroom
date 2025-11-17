import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { openai } from "@/lib/openaiClient";
import { randomUUID } from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const { id } = req.query;

  try {
    // 1) DB에서 원본 이미지 URL 가져오기
    const { data: monster, error: fetchError } = await supabaseServer
      .from("monsters")
      .select("original_image_url")
      .eq("id", id)
      .single();

    if (fetchError || !monster) {
      console.error(fetchError);
      return res.status(404).json({ error: "Monster not found" });
    }

    const originalUrl = monster.original_image_url;

    // 2) DALL·E 2 이미지 생성
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: `
        Generate a cute monster illustration as if it is based on a child's drawing.
        Make it colorful and imaginative, suitable for a children's monster encyclopedia.
        (Note: The original drawing URL is ${originalUrl}, but treat this only as context.)
      `,
      size: "1024x1024",
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      console.error("OpenAI image response:", response);
      return res.status(500).json({ error: "OpenAI returned no image url" });
    }

    const openAiImageUrl = response.data[0].url;

    // 3) OpenAI 이미지 URL에서 이미지 다운로드
    const imageResponse = await fetch(openAiImageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to download OpenAI image:", imageResponse.status);
      return res.status(500).json({ error: "Failed to download OpenAI image" });
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // 4) Supabase Storage에 업로드할 파일명 생성
    const filename = `${Date.now()}-${randomUUID()}.png`;
    const filePath = `ai-images/${filename}`;

    // 5) Supabase Storage 업로드
    const { error: uploadError } = await supabaseServer.storage
      .from("monster-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // 6) 업로드된 파일의 public URL 조회
    const { data: publicData } = supabaseServer.storage
      .from("monster-images")
      .getPublicUrl(filePath);

    const finalUrl = publicData.publicUrl;

    // 7) DB 업데이트 (영구 URL 저장)
    const { error: updateError } = await supabaseServer
      .from("monsters")
      .update({ ai_image_url: finalUrl })
      .eq("id", id);

    if (updateError) {
      console.error("DB update error:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: "AI monster image generated and saved permanently!",
      ai_image_url: finalUrl,
    });

  } catch (err: any) {
    console.error("IMAGE GENERATION ERROR:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
}
