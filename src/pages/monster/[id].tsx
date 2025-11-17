import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

// ⭐ 등급 색상
const badgeColor = (grade: string | null) => {
  if (!grade) return "#9E9E9E";
  if (grade.startsWith("Lv.")) return "#9E9E9E";
  if (grade === "S") return "#43A047";
  if (grade === "SS") return "#1E88E5";
  if (grade === "LEGEND") return "#FB8C00";
  if (grade === "COSMIC") return "#8E24AA";
  if (grade === "INFINITY") return "#D32F2F";
  return "#9E9E9E";
};

export default function MonsterDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [monster, setMonster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 입력 상태
  const [name, setName] = useState("");
  const [levelInput, setLevelInput] = useState("");
  const [feature, setFeature] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchMonster() {
      const { data, error } = await supabase
        .from("monsters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setMonster(data);

      // 폼 초기값 채우기
      setName(data.monster_name ?? "");
      setLevelInput(data.level_input_value ?? "");
      setFeature(data.description ?? "");

      setLoading(false);
    }

    fetchMonster();
  }, [id]);

  // 🔥 저장 동작
  async function saveMonster() {
    const res = await fetch(`/api/monsters/${id}/update-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monster_name: name,
        level_input_value: levelInput,
        description: feature,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "저장 실패");
      return;
    }

    alert("저장 완료!");
    router.reload();
  }

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;
  if (!monster) return <div style={{ padding: 20 }}>몬스터 정보를 찾을 수 없습니다.</div>;

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Pretendard, sans-serif"
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          background: "#FFF3E0",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          marginBottom: 30
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>🧟‍♂️ 몬스터 도감</h1>
        <p style={{ color: "#555" }}>ID: {monster.id}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>

        {/* 원본 이미지 */}
        <div style={{
          background: "#E8F5E9",
          padding: 20,
          borderRadius: 16,
        }}>
          <h2>🎨 아이 그림</h2>
          <img
            src={monster.original_image_url}
            width="100%"
            style={{ borderRadius: 12, marginTop: 10 }}
          />
        </div>

        {/* AI 이미지 */}
        <div style={{
          background: "#E3F2FD",
          padding: 20,
          borderRadius: 16,
        }}>
          <h2>🐲 AI 몬스터 이미지</h2>
          {monster.ai_image_url ? (
            <img
              src={monster.ai_image_url}
              width="100%"
              style={{ borderRadius: 12, marginTop: 10 }}
            />
          ) : (
            <p>AI 이미지 없음</p>
          )}
        </div>

        {/* 📛 이름 입력 */}
        <div style={{
          background: "#F3E5F5",
          padding: 20,
          borderRadius: 16,
        }}>
          <h2>📛 몬스터 이름</h2>
          <input
            type="text"
            placeholder="예: 얼음킹"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />
        </div>

        {/* ⭐ 레벨 입력 */}
        <div
          style={{
            background: "#FFF3E0",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <h2>⭐ 몬스터 레벨</h2>

          <input
            type="text"
            placeholder="예: 99999, 무한대, 123"
            value={levelInput}
            onChange={(e) => setLevelInput(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />

          {/* 정규화된 등급 표시 */}
          {monster.level_grade && (
            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  padding: "6px 12px",
                  background: badgeColor(monster.level_grade),
                  color: "white",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                현재 등급: {monster.level_grade}
              </span>
            </div>
          )}
        </div>

        {/* 📝 특징 입력 */}
        <div
          style={{
            background: "#E8EAF6",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <h2>📝 몬스터 특징(설명)</h2>

          <textarea
            placeholder="예: 얼음 숨결을 내뿜는다"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />
        </div>

        {/* 💾 저장 버튼 */}
        <button
          onClick={saveMonster}
          style={{
            padding: "14px 20px",
            background: "#6A1B9A",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 18,
            border: "none",
            marginTop: 10,
          }}
        >
          💾 저장하기
        </button>

      </div>
    </div>
  );
}
