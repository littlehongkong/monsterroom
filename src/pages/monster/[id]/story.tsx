import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function StoryPage() {
  const router = useRouter();
  const { id } = router.query;

  const [monster, setMonster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("율이");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchMonster() {
      const { data } = await supabase
        .from("monsters")
        .select("*")
        .eq("id", id)
        .single();
      setMonster(data);
      setLoading(false);
    }
    fetchMonster();
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;

  const generateStory = async () => {
    setGenerating(true);
    const res = await fetch(`/api/monsters/${id}/generate-story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childName }),
    });
    const data = await res.json();
    setGenerating(false);
    // alert("스토리 생성 완료!");
    // window.location.reload();
    window.location.href = `/monster/${id}/story`;
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>📖 몬스터 스토리 생성</h1>
      <p>몬스터: {monster.monster_name ?? "이름 없음"}</p>

      <label>아이 이름:</label>
      <input
        value={childName}
        onChange={(e) => setChildName(e.target.value)}
        style={{
          padding: 8,
          border: "1px solid #ccc",
          borderRadius: 6,
          width: "100%",
          marginTop: 8,
        }}
      />

      <button
        onClick={generateStory}
        disabled={generating}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          background: "#5C6BC0",
          color: "#fff",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {generating ? "생성 중..." : "스토리 생성하기"}
      </button>

      <h2 style={{ marginTop: 40 }}>🌟 생성된 스토리</h2>
      <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
        {monster.story ?? "아직 생성되지 않았습니다."}
      </p>
    </div>
  );
}
