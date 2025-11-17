import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function MonsterList() {
  const [monsters, setMonsters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMonsters() {
      const { data, error } = await supabase
        .from("monsters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setMonsters(data || []);
      setLoading(false);
    }

    fetchMonsters();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;

  // ⭐ 레벨 등급별 색상 뱃지 스타일
  const badgeColor = (grade: string | null) => {
    if (!grade) return "#9E9E9E"; // default
    if (grade.startsWith("Lv.")) return "#9E9E9E"; // Gray
    if (grade === "S") return "#43A047";           // Green
    if (grade === "SS") return "#1E88E5";          // Blue
    if (grade === "LEGEND") return "#FB8C00";      // Orange
    if (grade === "COSMIC") return "#8E24AA";      // Purple
    if (grade === "INFINITY") return "#D32F2F";    // Red
    return "#9E9E9E";
  };

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>📚 몬스터 도감 목록</h1>

      {monsters.length === 0 && <p>아직 생성된 몬스터가 없습니다.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        {monsters.map((m) => (
          <Link
            key={m.id}
            href={`/monster/${m.id}`}
            style={{
              background: "#F3F4F6",
              padding: 16,
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              transition: "transform 0.1s ease",
            }}
          >
            {/* 이미지 */}
            <div style={{ marginBottom: 10 }}>
              <img
                src={m.ai_image_url || m.original_image_url}
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            </div>

            {/* 몬스터 이름 */}
            <h3 style={{ fontSize: 18, margin: "8px 0" }}>
              {m.monster_name ? m.monster_name : "이름 미정 몬스터"}
            </h3>

            {/* ⭐ 레벨 등급 뱃지 */}
            <div style={{ marginBottom: 8 }}>
              {m.level_grade ? (
                <span
                  style={{
                    padding: "4px 8px",
                    background: badgeColor(m.level_grade),
                    color: "white",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {m.level_grade}
                </span>
              ) : (
                <span
                  style={{
                    padding: "4px 8px",
                    background: "#BDBDBD",
                    color: "white",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  레벨 미정
                </span>
              )}
            </div>

            {/* 설명 상태 */}
            <p style={{ fontSize: 14, color: "#555" }}>
              {m.monster_name ? "AI 정보 생성됨" : "AI 정보 생성 전"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
