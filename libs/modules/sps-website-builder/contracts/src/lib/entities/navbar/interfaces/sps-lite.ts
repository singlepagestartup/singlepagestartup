import { IComponent as IPageBlock } from "../../../components/page-blocks/interfaces";

export interface IEntity {
  id: number;
  locale: string;
  title: string;
  uid: string | null;
  className: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  variant: "boxed";
  position: "fixed";
  side: "top";
  pageBlocks?: IPageBlock[] | null;
}