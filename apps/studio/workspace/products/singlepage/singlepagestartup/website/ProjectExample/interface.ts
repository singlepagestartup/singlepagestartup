import type { ICodeFrameworkWebsiteContent } from "../content";

export interface IProjectExampleProps {
  content: ICodeFrameworkWebsiteContent;
  selected: number;
}

export interface IExampleProps {
  labels: Record<string, string>;
}

export interface IExampleCourse {
  id: string;
  title: string;
  description: string;
  lessons: string;
  rub: number;
  usd: number;
}

export interface IExampleArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  body: string;
  privateBody: string;
  cover: string;
}
