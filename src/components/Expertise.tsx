import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faReact,
  faNodeJs,
  faGitAlt,
} from "@fortawesome/free-brands-svg-icons";
import Chip from "@mui/material/Chip";
import "../assets/styles/Expertise.scss";

const labelsFirst = [
  "React.js",
  "Next.js",
  "JavaScript",
  "TypeScript",
  "HTML5",
  "CSS3",
  "Sass",
  "Bootstrap",
];

const labelsSecond = [
  "Node.js",
  "Express.js",
  "MongoDB",
  "MySQL",
  "REST APIs",
  "Postman",
];

const labelsThird = [
  "Git",
  "GitHub",
  "JIRA",
  "VS Code",
  "Python (Basic)",
  "Mobile App Fundamentals",
];

function Expertise() {
  return (
    <div className="container" id="expertise">
      <div className="skills-container">
        <h1>Expertise</h1>

        <div className="skills-grid">
          {/* ⭐ FRONTEND */}
          <div className="skill">
            <FontAwesomeIcon icon={faReact} size="3x" />
            <h3>Frontend Development</h3>
            <p>
              I specialize in building responsive, user-friendly interfaces
              using React.js and modern web technologies. I focus on creating
              clean layouts, reusable components, and smooth user experiences.
            </p>
            <div className="flex-chips">
              <span className="chip-title">Tech stack:</span>
              {labelsFirst.map((label, index) => (
                <Chip key={index} className="chip" label={label} />
              ))}
            </div>
          </div>

          {/* ⭐ BACKEND */}
          <div className="skill">
            <FontAwesomeIcon icon={faNodeJs} size="3x" />
            <h3>Backend & API Development</h3>
            <p>
              I build scalable backend services using Node.js and Express.js. I
              have hands-on experience working with both SQL and NoSQL databases
              and creating secure RESTful APIs for real-world applications.
            </p>
            <div className="flex-chips">
              <span className="chip-title">Tech stack:</span>
              {labelsSecond.map((label, index) => (
                <Chip key={index} className="chip" label={label} />
              ))}
            </div>
          </div>

          {/* ⭐ TOOLS */}
          <div className="skill">
            <FontAwesomeIcon icon={faGitAlt} size="3x" />
            <h3>Tools, Workflow & Collaboration</h3>
            <p>
              I use modern development tools and workflows to ensure clean code,
              version control, and smooth collaboration. I enjoy working in
              agile environments and continuously improving productivity.
            </p>
            <div className="flex-chips">
              <span className="chip-title">Tools I use:</span>
              {labelsThird.map((label, index) => (
                <Chip key={index} className="chip" label={label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Expertise;