import React from "react";
import type { ResumeData } from "@/types";

export interface ResumeLabels {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  projects: string;
  awards: string;
  activities: string;
  contact: string;
}

interface PrintableResumeProps {
  resume: ResumeData;
  innerRef: React.RefObject<HTMLDivElement>;
  labels: ResumeLabels;
}

const styles = `
  .printable-resume { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      color: #111827; 
      background-color: white; 
      width: 210mm; 
      min-height: 297mm; 
      padding: 1.25cm; 
      box-sizing: border-box; 
  }
  .printable-resume h1 { font-size: 26pt; font-weight: 700; text-align: center; margin: 0 0 5px 0; }
  .printable-resume .contact-info { text-align: center; font-size: 10pt; color: #4b5563; margin-bottom: 8px; }
  .printable-resume .contact-info a { color: #2563eb; text-decoration: none; }
  .printable-resume .divider { border-top: 1px solid #d1d5db; margin: 16px 0; }
  .printable-resume h2 { font-size: 12pt; font-weight: 700; text-transform: uppercase; color: #1f2937; margin: 20px 0 8px 0; letter-spacing: 1px; border-bottom: 2px solid #1f2937; padding-bottom: 4px; }
  .printable-resume p { margin: 0; font-size: 10pt; line-height: 1.6; color: #374151; }
  .printable-resume .section-item { margin-bottom: 16px; }
  .printable-resume .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .printable-resume .item-title { font-size: 11pt; font-weight: 600; color: #111827; }
  .printable-resume .item-subtitle { font-size: 10pt; font-weight: 500; text-transform: uppercase; color: #374151; margin-top: 2px; }
  .printable-resume .item-date { font-size: 10pt; font-style: italic; color: #4b5563; }
  .printable-resume .item-description { font-size: 10pt; color: #4b5563; padding-left: 0; }
  .printable-resume .item-description ul { margin: 6px 0 0 0; padding-left: 18px; list-style-type: disc; }
  .printable-resume .item-description li { margin-bottom: 5px; line-height: 1.5; }
  .printable-resume .skills-list { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 10pt; margin-top: 4px; }
  .printable-resume .skill-item::after { content: '•'; margin-left: 12px; color: #9ca3af; }
  .printable-resume .skill-item:last-child::after { display: none; }
`;

export const PrintableResume: React.FC<PrintableResumeProps> = ({
  resume,
  innerRef,
  labels,
}) => {
  return (
    <>
      <style>{styles}</style>
      <div ref={innerRef} className="printable-resume">
        <header>
          <h1>{resume.contact.name}</h1>
          <p className="contact-info">
            {resume.contact.email}
            {resume.contact.phone && ` | ${resume.contact.phone}`}
            {resume.contact.address && ` | ${resume.contact.address}`}
            {resume.contact.linkedin && (
              <>
                {" "}
                |{" "}
                <a href={resume.contact.linkedin}>{resume.contact.linkedin}</a>
              </>
            )}
          </p>
        </header>

        {resume.summary && (
          <section>
            <p style={{ textAlign: "center", marginTop: "16px" }}>
              {resume.summary}
            </p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section>
            <h2>{labels.experience}</h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="section-item">
                <div className="item-header">
                  <span className="item-title">{exp.jobTitle}</span>
                  <span className="item-date">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <div className="item-subtitle">{exp.company}</div>
                {exp.description && (
                  <div className="item-description">
                    <ul>
                      {exp.description
                        .split("\n")
                        .map(
                          (line, i) =>
                            line.trim() && (
                              <li key={i}>{line.replace(/^- ?/, "").trim()}</li>
                            )
                        )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.projects?.length > 0 && (
          <section>
            <h2>{labels.projects}</h2>
            {resume.projects.map((proj) => (
              <div key={proj.id} className="section-item">
                <div className="item-header">
                  <span className="item-title">{proj.title}</span>
                </div>
                {proj.description && (
                  <div className="item-description">
                    <ul>
                      {proj.description
                        .split("\n")
                        .map(
                          (line, i) =>
                            line.trim() && (
                              <li key={i}>{line.replace(/^- ?/, "").trim()}</li>
                            )
                        )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.education?.length > 0 && (
          <section>
            <h2>{labels.education}</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="section-item">
                <div className="item-header">
                  <span className="item-title">{edu.degree}</span>
                  <span className="item-date">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <div className="item-subtitle">{edu.school}</div>
              </div>
            ))}
          </section>
        )}

        {resume.skills?.length > 0 && (
          <section>
            <h2>{labels.skills}</h2>
            <div className="skills-list">
              {resume.skills.map((skill, i) => (
                <span key={i} className="skill-item">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.languages?.length > 0 && (
          <section>
            <h2>{labels.languages}</h2>
            <div className="skills-list">
              {resume.languages.map((lang, i) => (
                <span key={i} className="skill-item">
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.awards?.length > 0 && (
          <section>
            <h2>{labels.awards}</h2>
            {resume.awards.map((award) => (
              <div key={award.id} className="section-item">
                <div className="item-header">
                  <span className="item-title">{award.title}</span>
                  <span className="item-date">{award.date}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {resume.activities?.length > 0 && (
          <section>
            <h2>{labels.activities}</h2>
            {resume.activities.map((act) => (
              <div key={act.id} className="section-item">
                <div className="item-header">
                  <span className="item-title">{act.title}</span>
                </div>
                {act.description && (
                  <div className="item-description">
                    <ul>
                      {act.description
                        .split("\n")
                        .map(
                          (line, i) =>
                            line.trim() && (
                              <li key={i}>{line.replace(/^- ?/, "").trim()}</li>
                            )
                        )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
};
