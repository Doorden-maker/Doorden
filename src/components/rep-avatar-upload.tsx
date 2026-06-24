"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function RepAvatarUpload({ currentAvatar, repName }: { currentAvatar?: string | null; repName: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);

  const initials = repName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/rep/avatar", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    if (json.avatarUrl) { setPreview(json.avatarUrl); router.refresh(); }
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow">
        {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <span className="text-blue-700 font-bold text-lg">{initials}</span>}
      </div>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <span className="text-white text-xs">{uploading ? "..." : "📷"}</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={upload} className="hidden" />
    </div>
  );
}
