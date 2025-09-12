// app/(dashboard)/dashboard/cv/upload/page.tsx
import ResumeUploadDialog from "@/components/compass/ResumeUploadDialog";

export default function UploadPage() {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Upload your CV</h1>
      <p className="mt-1 text-sm text-gray-600">PDF or DOCX up to 5 MB.</p>
      <div className="mt-4">
        <ResumeUploadDialog />
      </div>
    </div>
  );
}
