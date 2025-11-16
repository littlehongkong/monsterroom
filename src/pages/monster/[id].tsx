import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";

export default function MonsterDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [monster, setMonster] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchMonster();
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;
  if (!monster) return <div style={{ padding: 20 }}>몬스터 정보를 찾을 수 없습니다.</div>;

  return (
    <div style={{
      maxWidth: 800,
      margin: "0 auto",
      padding: 20,
      fontFamily: "Pretendard, sans-serif"
    }}>
      
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
            <>
              <p>AI 이미지 생성 전입니다.</p>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/monsters/${id}/generate-image`, { method: "POST" });
                  await res.json();
                  window.location.reload();
                }}
                style={{
                  padding: "10px 14px",
                  background: "#0277BD",
                  color: "white",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                AI 이미지 생성하기
              </button>
            </>
          )}
        </div>

        {/* 이름/설명 */}
        <div style={{
          background: "#F3E5F5",
          padding: 20,
          borderRadius: 16,
        }}>
          <h2>📛 몬스터 이름</h2>
          <p>{monster.monster_name ?? "AI 생성 전"}</p>

          <h2>📝 설명</h2>
          <p>{monster.description ?? "AI 생성 전"}</p>

          {/* 이름/설명 버튼 조건부 렌더링 */}
          {!monster.monster_name && !monster.description ? (
            <button
              onClick={async () => {
                const res = await fetch(`/api/monsters/${id}/generate-info`, { method: "POST" });
                await res.json();
                window.location.reload();
              }}
              style={{
                marginTop: 20,
                padding: "10px 16px",
                background: "#6A1B9A",
                color: "white",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              이름/설명 생성하기
            </button>
          ) : (
            <p style={{ color: "#666", marginTop: 10 }}>✓ 이름과 설명이 생성되었습니다.</p>
          )}
        </div>

        {/* 스토리 카드 */}
        <div
          style={{
            background: "#FFF8E1",
            padding: 20,
            borderRadius: 16,
            marginTop: 30,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}
        >
          <h2>📖 몬스터 스토리</h2>

          {monster.story ? (
            <>
              <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
                {monster.story}
              </p>

              {/* 스토리 보기 버튼 */}
              <a
                href={`/monster/${monster.id}/story`}
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  padding: "10px 16px",
                  background: "#5C6BC0",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                📘 스토리 보러가기 →
              </a>
            </>
          ) : (
            <>
              <p>스토리 생성 전입니다.</p>

              {/* 스토리 만들기 버튼 (스토리 없을 때만 표시) */}
              <a
                href={`/monster/${monster.id}/story`}
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  padding: "12px 18px",
                  background: "#3949AB",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                📖 스토리 만들기 →
              </a>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
