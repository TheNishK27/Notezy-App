import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  UploadSimple,
  FileText,
  CurrencyInr,
  GraduationCap,
  BookOpenText,
  CheckCircle,
  WarningCircle,
  X,
  Sparkle,
} from "@phosphor-icons/react";

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

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const Field = ({ label, helper, className = "", ...props }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide text-neutral-700 dark:text-neutral-300">
      {label}
    </span>
    <input {...props} className="notezy-input w-full min-w-0 text-sm" />
    {helper && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{helper}</p>}
  </label>
);

const SelectField = ({ label, value, onChange, children, required = false, helper }) => (
  <label className="block min-w-0">
    <span className="block text-xs uppercase font-bold mb-1 tracking-wide text-neutral-700 dark:text-neutral-300">
      {label}
    </span>
    <select value={value} onChange={onChange} required={required} className="notezy-input w-full min-w-0 text-sm truncate">
      {children}
    </select>
    {helper && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{helper}</p>}
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

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

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

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [dragActive, setDragActive] = useState(false);

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

  const finalSubject = useMemo(() => {
    return form.subject === "__custom__" ? form.customSubject.trim() : form.subject.trim();
  }, [form.subject, form.customSubject]);

  const priceNumber = Number(form.price || 0);
  const canSubmit = Boolean(file && form.title && form.description && form.branch && finalSubject && priceNumber >= 0 && priceNumber <= 100 && !loading);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (selectedFile.size > 40 * 1024 * 1024) {
      toast.error("PDF is too large. Keep it under 40 MB for beta.");
      return;
    }

    setFile(selectedFile);
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

    if (!file) return toast.error("Please attach a PDF file");
    if (!form.branch) return toast.error("Please select a branch");
    if (!finalSubject) return toast.error("Please select or enter a subject");
    if (priceNumber < 0 || priceNumber > 100) return toast.error("Price must be between ₹0 and ₹100");

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

      if (profileError) throw profileError;

      const safeName = `${Date.now()}-${file.name.replaceAll(" ", "-")}`;
      const fullPath = `${userId}/${safeName}`;
      const previewPath = `${userId}/preview-${safeName}`;
      const thumbnailPath = `${userId}/thumb-${safeName.replace(".pdf", ".jpg")}`;

      toast.info("Generating preview and thumbnail...");
      const previewBlob = await createPreviewPdf(file);
      const thumbnailBlob = await createPdfThumbnail(file);

      toast.info("Uploading secure files...");
      const { error: fullUploadError } = await supabase.storage
        .from("notes")
        .upload(fullPath, file, { contentType: "application/pdf", upsert: false });
      if (fullUploadError) throw fullUploadError;

      const { error: previewUploadError } = await supabase.storage
        .from("previews")
        .upload(previewPath, previewBlob, { contentType: "application/pdf", upsert: false });
      if (previewUploadError) throw previewUploadError;

      const { error: thumbUploadError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailPath, thumbnailBlob, { contentType: "image/jpeg", upsert: false });
      if (thumbUploadError) throw thumbUploadError;

      const { data: previewUrlData } = supabase.storage.from("previews").getPublicUrl(previewPath);
      const { data: thumbUrlData } = supabase.storage.from("thumbnails").getPublicUrl(thumbnailPath);

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
          price: priceNumber,
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 text-black dark:text-white overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-11 h-11 border-2 border-black dark:border-white rounded-md flex items-center justify-center bg-[#4C7BF4] text-white brutal-shadow-sm">
            <UploadSimple size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-5xl leading-none break-words">Upload Note</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
              Create preview, thumbnail, and secure full PDF automatically.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-md px-3 py-2 brutal-shadow-sm text-xs uppercase font-bold w-fit">
          <Sparkle size={14} weight="fill" /> NIT Patna Beta
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start min-w-0">
        <div className="lg:col-span-8 space-y-5 min-w-0">
          <section className="notezy-card p-4 sm:p-6 space-y-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#4ADE80] text-black border-2 border-black dark:border-white rounded-md flex items-center justify-center shrink-0">
                <BookOpenText size={20} weight="bold" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl break-words">Note Details</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Add enough detail so buyers understand what they are purchasing.
                </p>
              </div>
            </div>

            <Field label="Title" placeholder="e.g. DSP Handwritten Notes" value={form.title} onChange={set("title")} required />

            <label className="block">
              <span className="block text-xs uppercase font-bold mb-1 tracking-wide text-neutral-700 dark:text-neutral-300">
                Description
              </span>
              <textarea
                rows={4}
                value={form.description}
                onChange={set("description")}
                required
                placeholder="What's inside? Why is it useful? Mention units, PYQs, solved examples, diagrams, etc."
                className="notezy-input w-full min-w-0 text-sm resize-none min-h-[120px]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <SelectField label="Branch" value={form.branch} onChange={set("branch")} required>
                <option value="">Select branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </SelectField>

              <SelectField label="Semester" value={form.semester} onChange={set("semester")} required>
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </SelectField>
            </div>

            <SelectField label="Subject" value={form.subject} onChange={set("subject")} required>
              <option value="">
                {!form.branch ? "Select branch first" : subjects.length === 0 ? "No subjects found — choose Other" : "Select subject"}
              </option>
              {subjects.map((subject) => (
                <option key={subject.subject_name} value={subject.subject_name}>{subject.subject_name}</option>
              ))}
              <option value="__custom__">✏️ Other (Enter manually)</option>
            </SelectField>

            {form.subject === "__custom__" && (
              <Field label="Custom Subject Name" placeholder="Enter subject name" value={form.customSubject} onChange={set("customSubject")} required />
            )}
          </section>

          <section className="notezy-card p-4 sm:p-6 space-y-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#FF6B9E] text-black border-2 border-black dark:border-white rounded-md flex items-center justify-center shrink-0">
                <FileText size={20} weight="bold" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl break-words">PDF File</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Upload one PDF. A 3-page preview and thumbnail will be generated.
                </p>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-all min-w-0 ${
                dragActive
                  ? "border-[#4C7BF4] bg-blue-50 dark:bg-blue-950/30"
                  : "border-black dark:border-white bg-[#FAFAFA] dark:bg-[#111111]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFile(e.target.files?.[0])}
                required={!file}
                className="hidden"
              />

              {!file ? (
                <div className="space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#F4FF47] text-black border-2 border-black dark:border-white flex items-center justify-center brutal-shadow-sm">
                    <UploadSimple size={28} weight="bold" />
                  </div>
                  <div>
                    <div className="font-display text-xl sm:text-2xl break-words">Drop your PDF here</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      or click to browse from your device
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    PDF only · recommended size under 40 MB
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-md bg-[#4ADE80] text-black border-2 border-black dark:border-white flex items-center justify-center shrink-0">
                      <FileText size={24} weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate max-w-[220px] sm:max-w-none">{file.name}</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-300">{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="notezy-icon-btn self-start sm:self-auto"
                    title="Remove file"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5 min-w-0">
          <section className="notezy-card p-4 sm:p-6 space-y-4 min-w-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-md flex items-center justify-center shrink-0">
                <CurrencyInr size={20} weight="bold" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl break-words">Pricing</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">Keep it affordable for students.</p>
              </div>
            </div>

            <label className="block">
              <span className="block text-xs uppercase font-bold mb-1 tracking-wide text-neutral-700 dark:text-neutral-300">
                Price
              </span>
              <div className="flex items-center border-2 border-black dark:border-white rounded-md bg-white dark:bg-[#111111] overflow-hidden">
                <div className="px-3 font-display text-xl bg-[#F4FF47] text-black self-stretch flex items-center border-r-2 border-black dark:border-white">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.price}
                  onChange={set("price")}
                  required
                  className="w-full min-w-0 bg-transparent px-3 py-2 outline-none text-sm text-black dark:text-white"
                />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">₹0 = Free · Max ₹100</p>
            </label>
          </section>

          <section className="notezy-card p-4 sm:p-6 space-y-4 min-w-0">
            <h2 className="font-display text-2xl">Publish Checklist</h2>
            <ChecklistItem done={Boolean(file)} text="PDF file attached" />
            <ChecklistItem done={Boolean(form.title)} text="Title added" />
            <ChecklistItem done={Boolean(form.description)} text="Description added" />
            <ChecklistItem done={Boolean(form.branch)} text="Branch selected" />
            <ChecklistItem done={Boolean(finalSubject)} text="Subject selected" />
            <ChecklistItem done={priceNumber >= 0 && priceNumber <= 100} text="Price is valid" />
          </section>

          <section className="bg-[#F4FF47] text-black border-2 border-black dark:border-white rounded-lg p-4 sm:p-5 brutal-shadow space-y-4 min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase font-bold">
              <GraduationCap size={16} weight="bold" /> Uploading for
            </div>
            <div className="font-display text-2xl sm:text-3xl leading-none break-words">NIT Patna</div>
            <p className="text-sm text-neutral-700">
              Your note will appear in Browse only after admin approval.
            </p>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full min-w-0 notezy-blue-btn py-3 rounded-md uppercase font-display text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadSimple size={20} weight="bold" />
              {loading ? "Publishing..." : "Publish Note"}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}

const ChecklistItem = ({ done, text }) => (
  <div className="flex items-start gap-2 text-sm min-w-0">
    {done ? (
      <CheckCircle size={18} weight="fill" className="text-green-600 dark:text-green-400" />
    ) : (
      <WarningCircle size={18} weight="bold" className="text-neutral-400" />
    )}
    <span className={done ? "font-bold break-words" : "text-neutral-600 dark:text-neutral-400 break-words"}>{text}</span>
  </div>
);
