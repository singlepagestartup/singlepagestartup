export const variant = "subject-me-blog-module-article-create" as const;
export interface IComponentProps {
  variant?: typeof variant;
  signedIn?: boolean;
  pending?: boolean;
  error?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
