import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { UploadSimple, FileText } from "@phosphor-icons/react";

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
    if (!file) return toast.error("Please attach a PDF file");

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Please login first");

      const userId = userData.user.id;
      const meta = userData.user.user_metadata || {};

const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  full_name: meta.full_name || "Student",
  college_email: userData.user.email,
  branch: meta.branch || form.branch,
  semester: Number(meta.semester || form.semester),
  is_verified: !!userData.user.email_confirmed_at,
});

if (profileError) {
  console.error("Profile error:", profileError);
  throw profileError;
}
      const safeFileName = `${Date.now()}-${file.name.replaceAll(" ", "-")}`;
      const filePath = `${userId}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: fileUrlData } = supabase.storage
        .from("notes")
        .getPublicUrl(filePath);

      let thumbnailUrl = null;

      if (thumb) {
        const safeThumbName = `${Date.now()}-${thumb.name.replaceAll(" ", "-")}`;
        const thumbPath = `${userId}/${safeThumbName}`;

        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbPath, thumb);

        if (thumbError) throw thumbError;

        const { data: thumbUrlData } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(thumbPath);

        thumbnailUrl = thumbUrlData.publicUrl;
      }

      const { data: collegeData } = await supabase
        .from("colleges")
        .select("id")
        .ilike("name", form.college)
        .single();

      const { data: noteData, error: insertError } = await supabase
        .from("notes")
        .insert({
          seller_id: userId,
          college_id: collegeData?.id || null,
          title: form.title,
          description: form.description,
          subject: form.subject,
          branch: form.branch,
          semester: Number(form.semester),
          price: Number(form.price),
          file_url: fileUrlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
  console.error("Note insert error:", insertError);
  throw insertError;
}

      toast.success("Note uploaded! Waiting for approval.");
      navigate(`/notes/${noteData.id}`);
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 border-2 border-black rounded-md flex items-center justify-center bg-[#4C7BF4] text-white">
          <UploadSimple size={20} weight="bold" />
        </div>
        <h1 className="font-display text-4xl">Upload Note</h1>
      </div>

      <form onSubmit={submit} className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4">
        <Field label="Title" placeholder="e.g. DSP Handwritten Notes" value={form.title} onChange={set("title")} required />

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1 tracking-wide">Description</span>
          <textarea rows={3} value={form.description} onChange={set("description")} required placeholder="What's inside? Why is it great?" className="w-full border-2 border-black rounded-md px-3 py-2 text-sm" />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Subject" value={form.subject} onChange={set("subject")} required placeholder="Digital Signal Processing" />
          <Field label="Branch" value={form.branch} onChange={set("branch")} required placeholder="ECE" />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Field type="number" min="1" max="10" label="Semester" value={form.semester} onChange={set("semester")} required />
          <Field label="College" value={form.college} onChange={set("college")} required placeholder="NIT Patna" />
          <Field label="University" value={form.university} onChange={set("university")} placeholder="AICTE" />
        </div>

        <Field label="Price ₹ (0 = Free, max 100)" type="number" min="0" max="100" value={form.price} onChange={set("price")} required />

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">PDF file</span>
          <div className="border-2 border-dashed border-black rounded-md p-4 flex items-center gap-3">
            <FileText size={20} />
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
        </label>

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">Thumbnail image optional</span>
          <input type="file" accept="image/*" onChange={(e) => setThumb(e.target.files?.[0] || null)} />
        </label>

        <button disabled={loading} className="w-full brutal-btn bg-[#F4FF47] py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50">
          <UploadSimple size={20} weight="bold" /> {loading ? "Uploading..." : "Publish Note"}
        </button>
      </form>
    </div>
  );
}