"use client";
import { useState } from "react";
import sourceText from "./page.md?raw";
import type { IFrameworkPageViewProps } from "./interface";
import { parseCodeFrameworkWebsite } from "./content";
import { SiteShell, siteStyles } from "./Site";
import {
  SectionLink,
  FrameworkHero,
  ProductExamples,
  ModuleCards,
  LaunchSteps,
  ProjectKnowledge,
  ModuleArticles,
  StartProject,
  FrameworkQuestions,
} from "./Sections";
export default function CodeFrameworkLanding({
  text,
  resolveLink,
}: IFrameworkPageViewProps = {}) {
  const content = parseCodeFrameworkWebsite(text ?? sourceText);
  const [selected, setSelected] = useState(0);
  return (
    <SiteShell
      active="framework"
      resolveLink={resolveLink}
      content={content}
      acquisition
      lang="ru"
    >
      <SectionLink
        href="#cf-main"
        className={`sr-only focus:not-sr-only focus:block focus:px-6 focus:py-4 ${siteStyles.focus}`}
      >
        {content.labels["skip-link"]}
      </SectionLink>
      <main id="cf-main" tabIndex={-1} className="outline-none">
        <FrameworkHero
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <ProductExamples
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <ModuleCards
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <LaunchSteps
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <ProjectKnowledge
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <ModuleArticles
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <StartProject
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
        <FrameworkQuestions
          content={content}
          selected={selected}
          onSelectExample={setSelected}
          resolveLink={resolveLink}
        />
      </main>
    </SiteShell>
  );
}
