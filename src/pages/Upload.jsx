import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { toast } from "sonner";
import { UploadSimple, FileText } from "@phosphor-icons/react";

const fileToB64 = (file) => new Promise((res, rej) => {
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = reader.result.toString().split(",")[1];
    res(b64);
  };
  reader.onerror = rej;
  reader.readAsDataURL(file);
});

const Field = ({ label, testId, ...props }) => (
  <label className="block">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide">{label}</span>
    <input data-testid={testId} {...props} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white" />
  </label>
);

export default function UploadPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", subject: "", semester: 1, branch: "", college: "",
    university: "", tags: "", price: 0, content_type: "PDF", category: "Engineering",
  });
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please attach a PDF file"); return; }
    setLoading(true);
    try {
      const file_b64 = await fileToB64(file);
      const thumbnail_b64 = thumb ? await fileToB64(thumb) : null;
      const payload = {
        ...form,
        semester: Number(form.semester),
        price: Number(form.price),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        file_b64, file_name: file.name, thumbnail_b64,
      };
      const r = await api.post("/notes", payload);
      toast.success("Note uploaded!");
      navigate(`/notes/${r.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#4C7BF4] text-white"><UploadSimple size={20} weight="bold" /></div>
        <h1 className="font-display text-4xl">Upload Note</h1>
      </div>

      <form onSubmit={submit} className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4">
        <Field testId="upload-title" label="Title" placeholder="e.g. DSP Handwritten Notes" value={form.title} onChange={set("title")} required />
        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1 tracking-wide">Description</span>
          <textarea data-testid="upload-description" rows={3} value={form.description} onChange={set("description")} required placeholder="What's inside? Why is it great?" className="w-full border-2 border-black rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field testId="upload-subject" label="Subject" value={form.subject} onChange={set("subject")} required placeholder="Digital Signal Processing" />
          <Field testId="upload-branch" label="Branch" value={form.branch} onChange={set("branch")} required placeholder="ECE" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field testId="upload-semester" type="number" min="1" max="10" label="Semester" value={form.semester} onChange={set("semester")} required />
          <Field testId="upload-college" label="College" value={form.college} onChange={set("college")} required placeholder="NIT Patna" />
          <Field testId="upload-university" label="University" value={form.university} onChange={set("university")} placeholder="AICTE" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs uppercase font-bold mb-1">Content type</span>
            <select data-testid="upload-content-type" value={form.content_type} onChange={set("content_type")} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white">
              {["PDF", "Handwritten", "Typed", "PYQ"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase font-bold mb-1">Category</span>
            <select data-testid="upload-category" value={form.category} onChange={set("category")} className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white">
              {["Engineering", "Medical", "Law", "MBA", "Commerce", "Arts", "Competitive Exams"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
        </div>
        <Field testId="upload-tags" label="Tags (comma separated)" value={form.tags} onChange={set("tags")} placeholder="dsp, ece, signals" />
        <Field testId="upload-price" type="number" min="0" max="100" label="Price ₹ (0 = Free, max 100)" value={form.price} onChange={set("price")} required />

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">PDF file</span>
          <div className="border-2 border-dashed border-black rounded-md p-4 flex items-center gap-3">
            <FileText size={20} />
            <input data-testid="upload-file" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" required />
          </div>
        </label>

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">Thumbnail image (optional)</span>
          <input data-testid="upload-thumbnail" type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] || null)} className="text-sm" />
        </label>

        <button data-testid="upload-submit" disabled={loading} className="w-full brutal-btn bg-[#F4FF47] py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50">
          <UploadSimple size={20} weight="bold" /> {loading ? "Uploading..." : "Publish Note"}
        </button>
      </form>
    </div>
  );
}
