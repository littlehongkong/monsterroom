import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import { supabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const config = {
  api: { bodyParser: false },
};

function parseForm(req: NextApiRequest): Promise<{ files: any }> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ files });
    });
  });
}

async function uploadToSupabase(file: File, folder: string) {
  const fileData = fs.readFileSync(file.filepath);
  const safeName = `${Date.now()}-${randomUUID()}.png`;
  const filePath = `${folder}/${safeName}`;

  const { error } = await supabaseServer.storage
    .from("monster-images")
    .upload(filePath, fileData, {
      contentType: file.mimetype || "image/png",
    });

  if (error) throw error;

  const { data } = supabaseServer.storage
    .from("monster-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}


/**
 * 레벨 입력값을 받아 정규화된 등급, 숫자값을 계산하는 함수
 * @param {string} inputValue
 * @returns {object} { level_input_value, level_grade, level_numeric }
 */
function computeLevel(inputValue: string) {
  const cleanValue = String(inputValue).trim();

  // 1) 무한대 또는 문자 기반 판단
  const infinityWords = ["무한", "무한대", "infinity", "∞", "inf", "무∞"];
  if (infinityWords.some(w => cleanValue.toLowerCase().includes(w))) {
    return {
      level_input_value: cleanValue,
      level_grade: "INFINITY",
      level_numeric: null,
    };
  }

  // 2) 숫자 여부 판단
  const numericValue = Number(cleanValue);

  if (isNaN(numericValue)) {
    // 숫자 아닌 경우(문자) → COSMIC으로 처리
    return {
      level_input_value: cleanValue,
      level_grade: "COSMIC",
      level_numeric: null,
    };
  }

  // 3) 숫자인 경우 등급 매핑
  let grade = "";
  if (numericValue < 100) grade = `Lv.${numericValue}`;
  else if (numericValue < 1000) grade = "S";
  else if (numericValue < 100_000_000) grade = "SS";
  else if (numericValue < 10 ** 20) grade = "LEGEND";
  else grade = "COSMIC";

  return {
    level_input_value: cleanValue,
    level_grade: grade,
    level_numeric: numericValue,
  };
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    // formData로부터 files + fields 모두 파싱
    const { files, fields } = await parseForm(req);

    const originalFile: File = files.original?.[0];
    const aiFile: File = files.ai?.[0];
    const inputLevel = fields.level?.[0] ?? null;  // ⭐ 추가된 부분

    if (!originalFile || !aiFile) {
      return res.status(400).json({ error: "Both 'original' and 'ai' files are required" });
    }
    if (!inputLevel) {
      return res.status(400).json({ error: "'level' field is required" });
    }

    // ⭐ 레벨 정규화 계산
    const levelData = computeLevel(inputLevel);

    // 1) Supabase에 파일 업로드
    const originalUrl = await uploadToSupabase(originalFile, "uploads");
    const aiUrl = await uploadToSupabase(aiFile, "ai-images");

    // 2) Supabase DB에 row 생성 + 레벨 저장
    const { data, error } = await supabaseServer
      .from("monsters")
      .insert({
        original_image_url: originalUrl,
        ai_image_url: aiUrl,
        level_input_value: levelData.level_input_value,
        level_grade: levelData.level_grade,
        level_numeric: levelData.level_numeric,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: "Monster imported successfully",
      monster: data,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
