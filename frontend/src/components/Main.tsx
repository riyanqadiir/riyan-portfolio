import React, { useEffect, useState } from "react";
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Visibility from '@mui/icons-material/Visibility';
import Download from '@mui/icons-material/Download';
import '../assets/styles/Main.scss';

interface ResumeData {
  hasResume: boolean;
  fileName?: string;
  previewUrl?: string;
  downloadUrl?: string;
}

interface ProfilePhotoData {
  hasProfilePhoto: boolean;
  imageUrl?: string;
}

function Main() {
  const [resume, setResume] = useState<ResumeData>({ hasResume: false });
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoData>({ hasProfilePhoto: false });

  useEffect(() => {
    fetch('/api/resume')
      .then((res) => res.ok ? res.json() : { hasResume: false })
      .then((data) => setResume(data))
      .catch(() => setResume({ hasResume: false }));
  }, []);

  useEffect(() => {
    fetch('/api/profile-photo')
      .then((res) => res.ok ? res.json() : { hasProfilePhoto: false })
      .then((data) => setProfilePhoto(data))
      .catch(() => setProfilePhoto({ hasProfilePhoto: false }));
  }, []);

  const avatarSrc =
    profilePhoto.hasProfilePhoto && profilePhoto.imageUrl
      ? profilePhoto.imageUrl
      : null;

  return (
    <div className="container">
      <div className="about-section">
        {avatarSrc && (
          <div className="image-wrapper">
            <img src={avatarSrc} alt="Riyan Qadir" />
          </div>
        )}
        <div className="content">
          <div className="social_icons">
            <a href="https://github.com/riyanqadiir" target="_blank" rel="noreferrer"><GitHubIcon/></a>
            <a href="https://www.linkedin.com/in/riyan-qadir/" target="_blank" rel="noreferrer"><LinkedInIcon/></a>
          </div>
          <h1>Riyan Qadir</h1>
          <p>Full Stack Engineer</p>

          {resume.hasResume && resume.previewUrl && resume.downloadUrl && (
            <div className="resume-actions">
              <a
                href={resume.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="resume-btn resume-btn-outline"
              >
                <Visibility fontSize="small" /> Preview Resume
              </a>
              <a
                href={resume.downloadUrl}
                download={resume.fileName || 'Resume.pdf'}
                className="resume-btn resume-btn-primary"
              >
                <Download fontSize="small" /> Download Resume
              </a>
            </div>
          )}

          <div className="mobile_social_icons">
            <a href="https://github.com/riyanqadiir" target="_blank" rel="noreferrer"><GitHubIcon/></a>
            <a href="https://www.linkedin.com/in/riyan-qadir/" target="_blank" rel="noreferrer"><LinkedInIcon/></a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
