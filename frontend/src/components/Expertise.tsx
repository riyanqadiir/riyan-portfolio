import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReact,
  faNodeJs,
  faGitAlt,
  faJs,
  faPython,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBriefcase,
  faCode,
  faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Chip from "@mui/material/Chip";
import "../assets/styles/Expertise.scss";

const ICON_MAP: Record<string, IconDefinition> = {
  react: faReact,
  "node-js": faNodeJs,
  "git-alt": faGitAlt,
  js: faJs,
  python: faPython,
  briefcase: faBriefcase,
  code: faCode,
  database: faDatabase,
};

interface ExpertiseItem {
  _id?: string;
  title: string;
  description: string;
  icon: string;
  chipsLabel: string;
  chips: string[];
}

const fallbackExpertise: ExpertiseItem[] = [
  {
    title: "Frontend Development",
    description:
      "I specialize in building responsive, user-friendly interfaces using React.js and modern web technologies.",
    icon: "react",
    chipsLabel: "Tech stack:",
    chips: ["React.js", "Next.js", "JavaScript", "TypeScript", "HTML5", "CSS3", "Sass", "Bootstrap"],
  },
  {
    title: "Backend & API Development",
    description:
      "I build scalable backend services using Node.js and Express.js with SQL and NoSQL databases.",
    icon: "node-js",
    chipsLabel: "Tech stack:",
    chips: ["Node.js", "Express.js", "MongoDB", "MySQL", "REST APIs", "Postman"],
  },
  {
    title: "Tools, Workflow & Collaboration",
    description:
      "I use modern development tools and workflows to ensure clean code and smooth collaboration.",
    icon: "git-alt",
    chipsLabel: "Tools I use:",
    chips: ["Git", "GitHub", "JIRA", "VS Code", "Python (Basic)", "Mobile App Fundamentals"],
  },
];

function Expertise() {
  const [items, setItems] = useState<ExpertiseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpertise = async () => {
      try {
        const res = await fetch("/api/expertise");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setItems(Array.isArray(data) && data.length > 0 ? data : fallbackExpertise);
      } catch {
        setItems(fallbackExpertise);
      } finally {
        setLoading(false);
      }
    };
    fetchExpertise();
  }, []);

  return (
    <div className="container" id="expertise">
      <div className="skills-container">
        <h1>Expertise</h1>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0" }}>Loading expertise...</p>
        ) : (
          <div className="skills-grid">
            {items.map((item, index) => (
              <div className="skill" key={item._id || index}>
                <FontAwesomeIcon icon={ICON_MAP[item.icon] || faCode} size="3x" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="flex-chips">
                  <span className="chip-title">{item.chipsLabel}</span>
                  {item.chips.map((label, chipIndex) => (
                    <Chip key={chipIndex} className="chip" label={label} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Expertise;
