import React from "react";
import "../assets/styles/Project.scss";

function Project() {
  return (
    <div className="projects-container" id="projects">
      <h1>Projects</h1>

      <div className="projects-grid">
        {/* 🌐 Global IT Solutions Website */}
        <div className="project">
          <a
            href="https://www.theglobalitsolutions.com/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/GitSol.png"
              className="zoom"
              alt="Global IT Solutions Website"
              width="100%"
            />
          </a>
          <a
            href="https://www.theglobalitsolutions.com/"
            target="_blank"
            rel="noreferrer"
          >
            <h2>The Global IT Solutions Website</h2>
          </a>
          <p>
            Developed and improved the company’s official website. Enhanced
            responsiveness, design structure, accessibility, and implemented
            reusable components with API integrations. Built using React.js,
            Node.js, Express.js, and MongoDB.
          </p>
        </div>

        {/* ✔️ TaskMaster App */}
        <div className="project">
          <a
            href="https://taskmaster-app-ashen.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/TaskMaster.png"
              className="zoom"
              alt="TaskMaster App"
              width="100%"
            />
          </a>
          <a
            href="https://taskmaster-app-ashen.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            <h2>TaskMaster – Task Management App</h2>
          </a>
          <p>
            A clean and modern productivity web app built using React.js and
            Node.js. Allows users to create, update, categorize, and track tasks
            efficiently. Features include filtering, priorities, responsive UI,
            and a smooth user experience.
          </p>
        </div>

        {/* 🍽 Next.js Food Project */}
        <div className="project">
          <a
            href="https://next-js-next-level-food.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/NextJs.png"
              className="zoom"
              alt="Next.js Food App"
              width="100%"
            />
          </a>
          <a
            href="https://next-js-next-level-food.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            <h2>Next-Level Food – Next.js Project</h2>
          </a>
          <p>
            A Next.js application demonstrating dynamic routing, server-side
            rendering (SSR), and modern UI patterns. Built as a hands-on
            learning project to strengthen skills in Next.js, React components,
            API routes, and page architecture.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Project;
