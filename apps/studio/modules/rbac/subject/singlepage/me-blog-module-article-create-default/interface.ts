export const variant = "me-blog-module-article-create-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  signedIn?: boolean;
  pending?: boolean;
  error?: string;
  rejected?: boolean;
  onEditDraft?: () => void;
}
export interface IComponentPropsExtended extends IComponentProps {}
