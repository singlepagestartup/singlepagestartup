export interface ISettingsPageProps {
  language: string;
}

export interface ITemplateExampleProps extends ISettingsPageProps {
  content: string;
}

export interface ISetupRecommendation {
  id: string;
  title: string;
  description: string;
  steps: string[];
  links: { label: string; path: string }[];
}
