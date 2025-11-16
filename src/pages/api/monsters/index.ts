import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

// Next.js에 Node 런타임 강제
export const config: PageConfig = {
  api: { bodyParser: false }
};

function parseForm(req: NextApiRequest): Promise<{ fields: any; files: any }> {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { files } = await parseForm(req);

    const uploadedFile: File = files.file?.[0] || files.file;
    if (!uploadedFile) return res.status(400).json({ error: "File not found (file key)" });

    if (!uploadedFile.filepath)
      return res.status(400).json({ error: "uploadedFile.filepath is undefined" });

    // 1) 파일 buffer 읽기
    const fileData = fs.readFileSync(uploadedFile.filepath);

    // 2) 안전한 파일명 생성
    const safeFileName = `${Date.now()}-${randomUUID()}.png`;
    const filePath = `uploads/${safeFileName}`;

    // 3) Supabase Storage 업로드
    const { error: uploadError } = await supabaseServer.storage
      .from("monster-images")
      .upload(filePath, fileData, {
        contentType: uploadedFile.mimetype || "image/png",
      });

    if (uploadError) {
      console.error("uploadError", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // 4) public URL 생성
    const { data: publicUrlData } = supabaseServer.storage
      .from("monster-images")
      .getPublicUrl(filePath);
    const originalImageUrl = publicUrlData.publicUrl;

    // ------------------------------
    //   5) monsters 테이블에 INSERT
    // ------------------------------
    const { data: inserted, error: insertError } = await supabaseServer
      .from("monsters")
      .insert({
        original_image_url: originalImageUrl,
        ai_image_url: null,
        monster_name: null,
        description: null,
        story: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("insertError", insertError);
      return res.status(500).json({ error: insertError.message });
    }

    return res.status(200).json({
      message: "Uploaded & Saved!",
      monster_id: inserted.id,
      originalImageUrl,
    });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
