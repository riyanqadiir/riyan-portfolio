import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import "../assets/styles/Timeline.scss";

function Timeline() {
  return (
    <div id="history">
      <div className="items-container">
        <h1>Career History</h1>

        <VerticalTimeline>

          {/* Web Developer */}
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            date="Apr 2024 – Apr 2025"
            iconStyle={{ background: "#5000ca", color: "#fff" }}
            icon={<FontAwesomeIcon icon={faBriefcase} />}
          >
            <h3 className="vertical-timeline-element-title">Web Developer</h3>
            <h4 className="vertical-timeline-element-subtitle">The Global IT Solutions</h4>
            <p>
              Developed the official company website, improved responsiveness and design structure,
              built reusable frontend components, and collaborated with the UI/UX and backend teams
              for API integration.
            </p>
          </VerticalTimelineElement>

          {/* Trainee Software Engineer */}
          <VerticalTimelineElement
            className="vertical-timeline-element--work"
            date="Jun 2023 – Aug 2024"
            iconStyle={{ background: "#5000ca", color: "#fff" }}
            icon={<FontAwesomeIcon icon={faBriefcase} />}
          >
            <h3 className="vertical-timeline-element-title">Trainee Software Engineer</h3>
            <h4 className="vertical-timeline-element-subtitle">SeeBiz Pvt. Ltd</h4>
            <p>
              Assisted in MERN stack development, wrote modular and scalable code, participated in
              agile meetings, and contributed to code reviews and team collaboration.
            </p>
          </VerticalTimelineElement>

          {/* Education */}
          <VerticalTimelineElement
            className="vertical-timeline-element--education"
            date="2022 – Present"
            iconStyle={{ background: "#5000ca", color: "#fff" }}
            icon={<FontAwesomeIcon icon={faBriefcase} />}
          >
            <h3 className="vertical-timeline-element-title">BS Software Engineering</h3>
            <h4 className="vertical-timeline-element-subtitle">Lahore Garrison University</h4>
            <p>
              7th semester — focusing on full-stack development, databases, and software engineering
              fundamentals.
            </p>
          </VerticalTimelineElement>

          <VerticalTimelineElement
            className="vertical-timeline-element--education"
            date="2022"
            iconStyle={{ background: "#5000ca", color: "#fff" }}
            icon={<FontAwesomeIcon icon={faBriefcase} />}
          >
            <h3 className="vertical-timeline-element-title">Intermediate (ICS)</h3>
            <h4 className="vertical-timeline-element-subtitle">Aspire Group of Colleges</h4>
          </VerticalTimelineElement>

        </VerticalTimeline>
      </div>
    </div>
  );
}

export default Timeline;
