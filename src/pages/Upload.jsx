import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { UploadSimple, FileText } from "@phosphor-icons/react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const BRANCHES = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Architecture and Planning",
  "Mathematics and Computing",
  "Chemical Science and Technology",
  "Mechatronics and Automation Engineering",
  "Master of Computer Applications",
];

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide">
      {label}
    </span>
    <input
      {...props}
      className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white"
    />
  </label>
);

const SelectField = ({ label, value, onChange, children, required = false }) => (
  <label className="block">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide">
      {label}
    </span>
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border-2 border-black rounded-md px-3 py-2 text-sm bg-white"
    >
      {children}
    </select>
  </label>
);

async function createPreviewPdf(file) {
  const bytes = await file.arrayBuffer();
  const fullPdf = await PDFDocument.load(bytes);
  const previewPdf = await PDFDocument.create();

  const totalPages = fullPdf.getPageCount();
  const previewPages = Math.min(3, Math.max(1, totalPages));

  const pages = await previewPdf.copyPages(
    fullPdf,
    Array.from({ length: previewPages }, (_, i) => i)
  );

  pages.forEach((page) => previewPdf.addPage(page));

  const previewBytes = await previewPdf.save();
  return new Blob([previewBytes], { type: "application/pdf" });
}

async function createPdfThumbnail(file) {
  const bytes = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: bytes,
  }).promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not generate PDF thumbnail"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.85
    );
  });
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    customSubject: "",
    semester: 1,
    branch: "",
    college: "NIT Patna",
    tags: "",
    price: 0,
  });

  const [file, setFile] = useState(null);

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
  };

  useEffect(() => {
    const loadSubjects = async () => {
      if (!form.branch || !form.semester) {
        setSubjects([]);
        return;
      }

      const { data, error } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("branch", form.branch)
        .eq("semester", Number(form.semester))
        .order("subject_name", { ascending: true });

      if (error) {
        console.error(error);
        setSubjects([]);
        return;
      }

      setSubjects(data || []);

      if (
        form.subject &&
        form.subject !== "__custom__" &&
        !(data || []).some((s) => s.subject_name === form.subject)
      ) {
        setForm((prev) => ({ ...prev, subject: "" }));
      }
    };

    loadSubjects();
  }, [form.branch, form.semester]);

  const submit = async (e) => {
    e.preventDefault();

    const finalSubject =
      form.subject === "__custom__"
        ? form.customSubject.trim()
        : form.subject.trim();

    if (!file) {
      toast.error("Please attach a PDF file");
      return;
    }

    if (!form.branch) {
      toast.error("Please select a branch");
      return;
    }

    if (!finalSubject) {
      toast.error("Please select or enter a subject");
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please login first");
      }

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

      if (profileError) throw profileError;

      const safeName = `${Date.now()}-${file.name.replaceAll(" ", "-")}`;
      const fullPath = `${userId}/${safeName}`;
      const previewPath = `${userId}/preview-${safeName}`;
      const thumbnailPath = `${userId}/thumb-${safeName.replace(".pdf", ".jpg")}`;

      const previewBlob = await createPreviewPdf(file);
      const thumbnailBlob = await createPdfThumbnail(file);

      const { error: fullUploadError } = await supabase.storage
        .from("notes")
        .upload(fullPath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (fullUploadError) throw fullUploadError;

      const { error: previewUploadError } = await supabase.storage
        .from("previews")
        .upload(previewPath, previewBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (previewUploadError) throw previewUploadError;

      const { error: thumbUploadError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailPath, thumbnailBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (thumbUploadError) throw thumbUploadError;

      const { data: previewUrlData } = supabase.storage
        .from("previews")
        .getPublicUrl(previewPath);

      const { data: thumbUrlData } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(thumbnailPath);

      const { data: collegeData } = await supabase
        .from("colleges")
        .select("id")
        .ilike("name", "NIT Patna")
        .maybeSingle();

      const { data: noteData, error: insertError } = await supabase
        .from("notes")
        .insert({
          seller_id: userId,
          college_id: collegeData?.id || null,
          title: form.title,
          description: form.description,
          subject: finalSubject,
          branch: form.branch,
          semester: Number(form.semester),
          college: "NIT Patna",
          price: Number(form.price),
          file_url: fullPath,
          preview_file_url: previewUrlData.publicUrl,
          thumbnail_url: thumbUrlData.publicUrl,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Note uploaded securely! Waiting for approval.");
      navigate(`/notes/${noteData.id}`);
    } catch (err) {
      console.error(err);
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

      <form
        onSubmit={submit}
        className="bg-white border-2 border-black rounded-lg p-6 brutal-shadow space-y-4"
      >
        <div className="bg-[#F4FF47] border-2 border-black rounded-md px-4 py-3 text-sm font-bold">
          Uploading for: NIT Patna
        </div>

        <Field
          label="Title"
          placeholder="e.g. DSP Handwritten Notes"
          value={form.title}
          onChange={set("title")}
          required
        />

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1 tracking-wide">
            Description
          </span>
          <textarea
            rows={3}
            value={form.description}
            onChange={set("description")}
            required
            placeholder="What's inside? Why is it great?"
            className="w-full border-2 border-black rounded-md px-3 py-2 text-sm"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <SelectField
            label="Branch"
            value={form.branch}
            onChange={set("branch")}
            required
          >
            <option value="">Select branch</option>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Semester"
            value={form.semester}
            onChange={set("semester")}
            required
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </SelectField>
        </div>

        <SelectField
          label="Subject"
          value={form.subject}
          onChange={set("subject")}
          required
        >
          <option value="">
            {!form.branch
              ? "Select branch first"
              : subjects.length === 0
              ? "No subjects found — choose Other"
              : "Select subject"}
          </option>

          {subjects.map((subject) => (
            <option key={subject.subject_name} value={subject.subject_name}>
              {subject.subject_name}
            </option>
          ))}

          <option value="__custom__">✏️ Other (Enter manually)</option>
        </SelectField>

        {form.subject === "__custom__" && (
          <Field
            label="Custom Subject Name"
            placeholder="Enter subject name"
            value={form.customSubject}
            onChange={set("customSubject")}
            required
          />
        )}

        <Field
          label="Price ₹ (0 = Free, max 100)"
          type="number"
          min="0"
          max="100"
          value={form.price}
          onChange={set("price")}
          required
        />

        <label className="block">
          <span className="block text-xs uppercase font-bold mb-1">
            PDF file
          </span>

          <div className="border-2 border-dashed border-black rounded-md p-4 flex items-center gap-3">
            <FileText size={20} />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <p className="text-xs text-neutral-500 mt-1">
            A 3-page preview and thumbnail will be generated automatically.
          </p>
        </label>

        <button
          disabled={loading}
          className="w-full brutal-btn bg-[#F4FF47] py-3 rounded-md uppercase font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UploadSimple size={20} weight="bold" />
          {loading ? "Uploading..." : "Publish Note"}
        </button>
      </form>
    </div>
  );
}