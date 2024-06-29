import { IRelation as IWidgetsToSpsFileStorageModuleWidgets } from "@sps/sps-website-builder/relations/widgets-to-sps-file-storage-module-widgets/contracts/root";
import type { IModel as IParentModel } from "@sps/sps-website-builder/models/widget/contracts/root";
import { IRelation as IWidgetToHeroSectionBlock } from "@sps/sps-website-builder/relations/widgets-to-hero-section-blocks/contracts/root";
import { IRelation as IWidgetToNavbarBlock } from "@sps/sps-website-builder/relations/widgets-to-navbar-blocks/contracts/root";
import { IRelation as IWidgetToFooterBlock } from "@sps/sps-website-builder/relations/widgets-to-footer-blocks/contracts/root";
import { IRelation as IWidgetToSliderBlock } from "@sps/sps-website-builder/relations/widgets-to-slider-blocks/contracts/root";
import { IRelation as IWidgetToFeaturesSectionBlock } from "@sps/sps-website-builder/relations/widgets-to-features-section-blocks/contracts/root";
import { IRelation as IFooterToWidget } from "@sps/sps-website-builder/relations/footers-to-widgets/contracts/root";
import { IRelation as INavbarToWidget } from "@sps/sps-website-builder/relations/navbars-to-widgets/contracts/root";
import { IRelation as IPageToWidget } from "@sps/sps-website-builder/relations/pages-to-widgets/contracts/root";

export interface IModel extends IParentModel {
  widgetsToSpsFileStorageModuleWidgets: IWidgetsToSpsFileStorageModuleWidgets[];
  widgetsToHeroSectionBlocks: IWidgetToHeroSectionBlock[];
  widgetsToNavbarBlocks: IWidgetToNavbarBlock[];
  footersToWidgets: IFooterToWidget[];
  navbarsToWidgets: INavbarToWidget[];
  pagesToWidgets: IPageToWidget[];
  widgetsToFooterBlocks: IWidgetToFooterBlock[];
  widgetsToSliderBlocks: IWidgetToSliderBlock[];
  widgetsToFeaturesSectionBlocks: IWidgetToFeaturesSectionBlock[];
}
