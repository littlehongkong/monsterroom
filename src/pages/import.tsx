import { useState } from "react";

export default function ImportPage() {
  const [original, setOriginal] = useState<File | null>(null);
  const [ai, setAi] = useState<File | null>(null);

  const upload = async () => {
    if (!original || !ai) {
      alert("Both original and AI image required");
      return;
    }

    const form = new FormData();
    form.append("original", original);
    form.append("ai", ai);

    const res = await fetch("/api/monsters/import", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🎁 몬스터 데이터 일괄 등록</h1>

      <p>원본 이미지</p>
      <input type="file" onChange={(e) => setOriginal(e.target.files?.[0] || null)} />

      <p>AI 몬스터 이미지</p>
      <input type="file" onChange={(e) => setAi(e.target.files?.[0] || null)} />

      <button onClick={upload} style={{ marginTop: 20, padding: "10px 14px" }}>
        등록하기
      </button>
    </div>
  );
}
