import { Component as Hidden } from "@sps/shared-frontend-components/singlepage/hidden";
import { Component as DemoHandoff } from "./demo-handoff";
import { Component as DemoDocument } from "./demo-document";
import { Component as DemoProject } from "./demo-project";
import { Component as LandingDisclosure } from "./landing-disclosure";
import { Component as LandingFollowup } from "./landing-followup";
import { Component as LandingWorkflow } from "./landing-workflow";
import { Component as LandingIntroduction } from "./landing-introduction";
import { Component as ContextProjectHeading } from "./context-project-heading";
import { Component as ContextResult } from "./context-result";
import { Component as ContextNote } from "./context-note";
import { Component as ContextHeading } from "./context-heading";
import { Component as Document } from "./document";
import { Component as PreviewScroll } from "./preview-scroll";
import { Component as Selectable } from "./selectable";
import { Component as DefinitionCard } from "./definition-card";
import { Component as DefinitionItem } from "./definition-item";
import { Component as DefinitionChecklist } from "./definition-checklist";
import { Component as Step } from "./step";
import { Component as CopyRequest } from "./copy-request";
import { Component as Dropdown } from "./dropdown";
import { Component as Card } from "./card";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as Default } from "./default";

export const variants = {
  hidden: Hidden,
  "demo-handoff": DemoHandoff,
  "demo-document": DemoDocument,
  "demo-project": DemoProject,
  "landing-disclosure": LandingDisclosure,
  "landing-followup": LandingFollowup,
  "landing-workflow": LandingWorkflow,
  "landing-introduction": LandingIntroduction,
  "context-project-heading": ContextProjectHeading,
  "context-result": ContextResult,
  "context-note": ContextNote,
  "context-heading": ContextHeading,
  document: Document,
  "preview-scroll": PreviewScroll,
  selectable: Selectable,
  "definition-card": DefinitionCard,
  "definition-item": DefinitionItem,
  "definition-checklist": DefinitionChecklist,
  step: Step,
  "copy-request": CopyRequest,
  dropdown: Dropdown,

  card: Card,

  "admin-form": AdminForm,
  "admin-select-input": AdminSelectInput,
  "admin-table": AdminTable,
  "admin-table-row": AdminTableRow,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
  find: Find,
};
