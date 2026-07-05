import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfPreview({ fileUrl, maxPreviewPages = 3 }) {
  const [numPages, setNumPages] = useState(null);

  console.log("PDF PREVIEW URL:", fileUrl);

  if (!fileUrl) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-5">
        No preview PDF available.
      </div>
    );
  }

  const pagesToShow = Math.min(numPages || maxPreviewPages, maxPreviewPages);

  return (
    <div className="bg-white border-2 border-black rounded-lg p-5 brutal-shadow">
      <h2 className="font-display text-2xl mb-2">PDF Preview</h2>

      <Document
        file={{ url: fileUrl }}
        onLoadSuccess={({ numPages }) => {
          console.log("PDF loaded. Pages:", numPages);
          setNumPages(numPages);
        }}
        onLoadError={(error) => {
          console.error("PDF LOAD ERROR:", error);
          console.log("FAILED PDF URL:", fileUrl);
        }}
        loading={<div className="py-6">Loading PDF preview...</div>}
        error={
          <div className="py-6 text-red-600">
            Failed to load PDF preview
          </div>
        }
      >
        <div className="space-y-5">
          {Array.from({ length: pagesToShow }, (_, index) => (
            <div key={index} className="border border-black rounded-md overflow-hidden">
              <Page
                pageNumber={index + 1}
                width={420}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}