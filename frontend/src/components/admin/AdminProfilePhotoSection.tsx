import React, { useEffect, useState } from "react";
import UploadFile from "@mui/icons-material/UploadFile";
import Visibility from "@mui/icons-material/Visibility";

interface ProfilePhotoInfo {
  hasProfilePhoto: boolean;
  fileName?: string;
  imageUrl?: string;
  previewUrl?: string;
  updatedAt?: string;
}

interface Props {
  token: string;
  isDark: boolean;
  cardColor: string;
  textColor: string;
  subTextColor: string;
  primaryColor: string;
  onAuthError: () => void;
}

export default function AdminProfilePhotoSection({
  token,
  isDark,
  cardColor,
  textColor,
  subTextColor,
  primaryColor,
  onAuthError,
}: Props) {
  const [photo, setPhoto] = useState<ProfilePhotoInfo>({ hasProfilePhoto: false });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPhoto = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile-photo");
      if (res.ok) setPhoto(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoto();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch("/api/profile-photo/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Profile photo updated successfully!");
        setPhoto({
          hasProfilePhoto: true,
          fileName: data.fileName,
          imageUrl: data.imageUrl,
          previewUrl: data.previewUrl,
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
        Upload your profile photo. It appears on the homepage hero and can be previewed here before publishing.
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
          <p style={{ color: subTextColor }}>Loading profile photo...</p>
        ) : photo.hasProfilePhoto && photo.imageUrl ? (
          <>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                overflow: "hidden",
                marginBottom: 20,
                border: `3px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
              }}
            >
              <img
                src={photo.imageUrl}
                alt="Profile preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{photo.fileName}</p>
            {photo.updatedAt && (
              <p style={{ color: subTextColor, fontSize: 13, margin: "0 0 20px" }}>
                Last updated: {new Date(photo.updatedAt).toLocaleString()}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {photo.previewUrl && (
                <a
                  href={photo.previewUrl}
                  target="_blank"
                  rel="noreferrer"
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
                  <Visibility fontSize="small" /> Preview
                </a>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: subTextColor, marginBottom: 20 }}>
            No profile photo uploaded yet. Upload one below to show it on the homepage.
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
          {uploading
            ? "Uploading..."
            : photo.hasProfilePhoto
              ? "Replace Profile Photo"
              : "Upload Profile Photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        <p style={{ color: subTextColor, fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Max size: 5 MB · JPEG, PNG, or WebP
        </p>
      </div>
    </div>
  );
}
