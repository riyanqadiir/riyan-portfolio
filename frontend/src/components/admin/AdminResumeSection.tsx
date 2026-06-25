import React, { useEffect, useState } from "react";
import UploadFile from "@mui/icons-material/UploadFile";
import Visibility from "@mui/icons-material/Visibility";
import Download from "@mui/icons-material/Download";

interface ResumeInfo {
  hasResume: boolean;
  fileName?: string;
  previewUrl?: string;
  downloadUrl?: string;
  updatedAt?: string;
}

interface Props {
  token: string;
  isDark: boolean;
  cardColor: string;
  textColor: string;
  subTextColor: string;
  inputBorderColor: string;
  primaryColor: string;
  onAuthError: () => void;
}

export default function AdminResumeSection({
  token,
  isDark,
  cardColor,
  textColor,
  subTextColor,
  inputBorderColor,
  primaryColor,
  onAuthError,
}: Props) {
  const [resume, setResume] = useState<ResumeInfo>({ hasResume: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchResume = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resume");
      if (res.ok) setResume(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Resume updated successfully!");
        setResume({
          hasResume: true,
          fileName: data.fileName,
          previewUrl: data.previewUrl,
          downloadUrl: data.downloadUrl,
          updatedAt: data.updatedAt,
        });
      } else if (res.status === 401) {
        onAuthError();
      } else {
        setError(data.message || "Upload failed.");
      }
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <p style={{ color: subTextColor, marginBottom: 24 }}>
        Upload your latest resume (PDF). Visitors can preview and download it from your homepage.
      </p>

      {error && (
        <div style={{ color: "#f87171", marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}
      {success && (
        <div style={{ color: "#4ade80", marginBottom: 16, fontSize: 14 }}>{success}</div>
      )}

      <div
        style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
        }}
      >
        {loading ? (
          <p style={{ color: subTextColor }}>Loading resume info...</p>
        ) : resume.hasResume ? (
          <>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{resume.fileName}</p>
            {resume.updatedAt && (
              <p style={{ color: subTextColor, fontSize: 13, margin: "0 0 20px" }}>
                Last updated: {new Date(resume.updatedAt).toLocaleString()}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {resume.previewUrl && (
                <a
                  href={resume.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 8,
                    backgroundColor: isDark ? "#334155" : "#e2e8f0",
                    color: textColor,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <Visibility fontSize="small" /> Preview
                </a>
              )}
              {resume.downloadUrl && (
                <a
                  href={resume.downloadUrl}
                  download={resume.fileName}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 8,
                    backgroundColor: primaryColor,
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <Download fontSize="small" /> Download
                </a>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: subTextColor, marginBottom: 20 }}>
            No resume uploaded yet. Upload a PDF below.
          </p>
        )}

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 8,
            backgroundColor: primaryColor,
            color: "#fff",
            cursor: uploading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 15,
            opacity: uploading ? 0.7 : 1,
          }}
        >
          <UploadFile fontSize="small" />
          {uploading ? "Uploading..." : resume.hasResume ? "Replace Resume (PDF)" : "Upload Resume (PDF)"}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        <p style={{ color: subTextColor, fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Max size: 10 MB · PDF only
        </p>
      </div>
    </div>
  );
}
