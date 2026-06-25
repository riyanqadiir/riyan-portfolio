import React, { useEffect, useState } from "react";
import "../assets/styles/Project.scss";

interface ProjectItem {
  _id?: string;
  title: string;
  description: string;
  image: string;
  imageUrl?: string;
  link: string;
}

const fallbackProjects: ProjectItem[] = [
  {
    title: "The Global IT Solutions Website",
    description: "Developed and improved the company’s official website. Enhanced responsiveness, design structure, accessibility, and implemented reusable components with API integrations. Built using React.js, Node.js, Express.js, and MongoDB.",
    image: "/GitSol.png",
    link: "https://www.theglobalitsolutions.com/",
  },
  {
    title: "TaskMaster – Task Management App",
    description: "A clean and modern productivity web app built using React.js and Node.js. Allows users to create, update, categorize, and track tasks efficiently. Features include filtering, priorities, responsive UI, and a smooth user experience.",
    image: "/TaskMaster.png",
    link: "https://taskmaster-app-ashen.vercel.app/",
  }
];

function Project() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        } else {
          setProjects(fallbackProjects);
        }
      } catch (error) {
        console.error("Error loading projects from api, using local fallback:", error);
        setProjects(fallbackProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="projects-container" id="projects">
      <h1>Projects</h1>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#ffffff', padding: '40px 0' }}>
          <p>Loading projects...</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div className="project" key={project._id || index}>
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="project-image-link"
              >
                <div className="project-image-wrap">
                  <img
                    src={project.imageUrl || project.image}
                    className="zoom"
                    alt={project.title}
                  />
                </div>
              </a>
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
              >
                <h2>{project.title}</h2>
              </a>
              <p>{project.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Project;
