import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import "../assets/styles/Timeline.scss";

interface TimelineItem {
  _id?: string;
  title: string;
  subtitle: string;
  description?: string;
  date: string;
  type: "work" | "education";
  order?: number;
}

const fallbackTimeline: TimelineItem[] = [
  {
    title: "Web Developer",
    subtitle: "The Global IT Solutions",
    description:
      "Developed the official company website, improved responsiveness and design structure, built reusable frontend components, and collaborated with the UI/UX and backend teams for API integration.",
    date: "Apr 2024 – Apr 2025",
    type: "work",
  },
  {
    title: "Trainee Software Engineer",
    subtitle: "SeeBiz Pvt. Ltd",
    description:
      "Assisted in MERN stack development, wrote modular and scalable code, participated in agile meetings, and contributed to code reviews and team collaboration.",
    date: "Jun 2023 – Aug 2024",
    type: "work",
  },
  {
    title: "BS Software Engineering",
    subtitle: "Lahore Garrison University",
    description:
      "7th semester — focusing on full-stack development, databases, and software engineering fundamentals.",
    date: "2022 – Present",
    type: "education",
  },
  {
    title: "Intermediate (ICS)",
    subtitle: "Aspire Group of Colleges",
    date: "2022",
    type: "education",
  },
];

function Timeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch("/api/timeline");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort(
            (a: TimelineItem, b: TimelineItem) => (a.order ?? 0) - (b.order ?? 0)
          );
          setItems(sorted);
        } else {
          setItems(fallbackTimeline);
        }
      } catch {
        setItems(fallbackTimeline);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  return (
    <div id="history">
      <div className="items-container">
        <h1>Career History</h1>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0" }}>Loading career history...</p>
        ) : (
          <VerticalTimeline>
            {items.map((item, index) => (
              <VerticalTimelineElement
                key={item._id || index}
                className={`vertical-timeline-element--${item.type}`}
                date={item.date}
                iconStyle={{ background: "#5000ca", color: "#fff" }}
                icon={<FontAwesomeIcon icon={faBriefcase} />}
              >
                <h3 className="vertical-timeline-element-title">{item.title}</h3>
                <h4 className="vertical-timeline-element-subtitle">{item.subtitle}</h4>
                {item.description ? <p>{item.description}</p> : null}
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>
        )}
      </div>
    </div>
  );
}

export default Timeline;
