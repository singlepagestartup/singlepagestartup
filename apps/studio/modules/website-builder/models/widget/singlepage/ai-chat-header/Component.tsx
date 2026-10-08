"use client";
import { useState } from "react";
import { Component as Header } from "./index";
export function Component() {
  const [projects, setProjects] = useState([
    { id: "pottery", name: "Pottery workshops" },
    { id: "photography", name: "Portrait photography" },
  ]);
  const [selected, setSelected] = useState("pottery");
  return (
    <div className="@container font-sps">
      <Header
        page="chat"
        projects={projects}
        selectedProject={selected}
        onProjectSelect={setSelected}
        onNewProject={() => {
          const id = `project-${projects.length + 1}`;
          setProjects((current) => [...current, { id, name: "New project" }]);
          setSelected(id);
        }}
      />
    </div>
  );
}
