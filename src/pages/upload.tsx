import { useState } from "react";

export default function Upload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleFile(e: any) {
    const f = e.target.files[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return alert("이미지를 선택해주세요.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    const res = await fetch("/api/monsters", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);
    setResult(data);

    if (data.monster_id) {
    window.location.href = `/monster/${data.monster_id}`;
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>그림 업로드</h1>
      
      <input type="file" accept="image/*" onChange={handleFile} />

      {preview && (
        <div>
          <p>미리보기:</p>
          <img src={preview} width="300" />
        </div>
      )}

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "업로드 중..." : "업로드하기"}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>업로드 성공!</h3>
          <img src={result.publicUrl} width="300" />
          <p>URL: {result.publicUrl}</p>
        </div>
      )}
    </div>
  );
}
