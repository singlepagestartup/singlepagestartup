import { IComponentProps as IHiddenComponentProps } from "@sps/shared-frontend-components/singlepage/hidden/interface";
import type { IComponentProps as IDemoHandoff } from "./demo-handoff/interface";
import type { IComponentProps as IDemoDocument } from "./demo-document/interface";
import type { IComponentProps as IDemoProject } from "./demo-project/interface";
import type { IComponentProps as ILandingDisclosure } from "./landing-disclosure/interface";
import type { IComponentProps as ILandingFollowup } from "./landing-followup/interface";
import type { IComponentProps as ILandingWorkflow } from "./landing-workflow/interface";
import type { IComponentProps as ILandingIntroduction } from "./landing-introduction/interface";
import type { IComponentProps as IContextProjectHeading } from "./context-project-heading/interface";
import type { IComponentProps as IContextResult } from "./context-result/interface";
import type { IComponentProps as IContextNote } from "./context-note/interface";
import type { IComponentProps as IContextHeading } from "./context-heading/interface";
import type { IComponentProps as IDocument } from "./document/interface";
import type { IComponentProps as IPreviewScroll } from "./preview-scroll/interface";
import type { IComponentProps as ISelectable } from "./selectable/interface";
import type { IComponentProps as IDefinitionCardProps } from "./definition-card/interface";
import type { IComponentProps as IDefinitionItemProps } from "./definition-item/interface";
import type { IComponentProps as IDefinitionChecklistProps } from "./definition-checklist/interface";
import type { IComponentProps as IStepProps } from "./step/interface";
import type { IComponentProps as ICopyRequestProps } from "./copy-request/interface";
import type { IComponentProps as IDropdownProps } from "./dropdown/interface";
import type { IComponentProps as ICard } from "./card/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";

export type IComponentProps =
  | IHiddenComponentProps
  | IDemoHandoff
  | IDemoDocument
  | IDemoProject
  | ILandingDisclosure
  | ILandingFollowup
  | ILandingWorkflow
  | ILandingIntroduction
  | IContextProjectHeading
  | IContextResult
  | IContextNote
  | IContextHeading
  | IDocument
  | IPreviewScroll
  | ISelectable
  | IDefinitionCardProps
  | IDefinitionItemProps
  | IDefinitionChecklistProps
  | IStepProps
  | ICopyRequestProps
  | IDropdownProps
  | ICard
  | IFindComponentProps
  | IAdminFormComponentProps
  | IAdminSelectInputComponentProps
  | IAdminTableComponentProps
  | IAdminTableRowComponentProps
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | IDefaultComponentProps;
