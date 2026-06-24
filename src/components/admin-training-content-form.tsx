"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AdminTrainingContentForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ level: "1", title: "", contentType: "lesson", content: "", sortOrder: "0" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/training/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, level: parseInt(form.level), sortOrder: parseInt(form.sortOrder) }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setForm({ level: "1", title: "", contentType: "lesson", content: "", sortOrder: "0" });
      window.location.reload();
    } else {
      alert("Failed to add content");
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>+ Add Training Content</Button>
    );
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3 bg-gray-50">
      <h4 className="font-medium text-gray-900">Add Training Content</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Level</Label>
          <Select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Content Type</Label>
          <Select value={form.contentType} onChange={e => setForm(f => ({ ...f, contentType: e.target.value }))}>
            <option value="lesson">Lesson (text)</option>
            <option value="video">Video (embed URL)</option>
            <option value="document">Document (link)</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Lesson title" />
      </div>
      <div className="space-y-1">
        <Label>{form.contentType === "lesson" ? "Content Text" : form.contentType === "video" ? "Embed URL (YouTube, Vimeo)" : "Document URL"}</Label>
        {form.contentType === "lesson" ? (
          <Textarea required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write the lesson content here..." />
        ) : (
          <Input required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={form.contentType === "video" ? "https://youtube.com/embed/..." : "https://..."} />
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Adding..." : "Add Content"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
