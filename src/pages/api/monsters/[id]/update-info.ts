import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabaseServer";

// ⭐ 레벨 정규화 함수
function computeLevel(inputValue: string) {
  const cleanValue = String(inputValue).trim();

  // 무한대 관련 문자열
  const infinityWords = ["무한", "무한대", "infinity", "∞", "inf", "무∞"];
  const lower = cleanValue.toLowerCase();

  if (infinityWords.some((w) => lower.includes(w))) {
    return {
      level_input_value: cleanValue,
      level_grade: "INFINITY",
      level_numeric: null,
    };
  }

  // 숫자 여부 판단
  const num = Number(cleanValue);

  if (isNaN(num)) {
    // 숫자가 아닌데 무한대도 아닐 경우 → COSMIC
    return {
      level_input_value: cleanValue,
      level_grade: "COSMIC",
      level_numeric: null,
    };
  }

  // 숫자인 경우 등급 계산
  let grade = "";
  if (num < 100) grade = `Lv.${num}`;
  else if (num < 1000) grade = "S";
  else if (num < 100_000_000) grade = "SS";
  else if (num < 10 ** 20) grade = "LEGEND";
  else grade = "COSMIC";

  return {
    level_input_value: cleanValue,
    level_grade: grade,
    level_numeric: num,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { id } = req.query;

    const { monster_name, level_input_value, description } = req.body;

    if (!id) return res.status(400).json({ error: "Missing monster ID" });

    // ⭐ 레벨 정규화
    const levelInfo = computeLevel(level_input_value || "");

    // ⭐ supabase 업데이트
    const { data, error } = await supabaseServer
      .from("monsters")
      .update({
        monster_name,
        description,
        level_input_value: levelInfo.level_input_value,
        level_grade: levelInfo.level_grade,
        level_numeric: levelInfo.level_numeric,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: "Monster updated",
      monster: data,
    });
  } catch (err: any) {
    console.error("update-info error:", err);
    return res.status(500).json({ error: err.message });
  }
}
