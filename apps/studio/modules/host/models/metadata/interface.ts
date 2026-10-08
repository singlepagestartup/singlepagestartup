import type { IHostRecord } from "../../../../workspace/utils/host-studio/interface";
export interface IModel extends IHostRecord {
  title: string;
  description: string | null;
  keywords: string | null;
  author: string | null;
  viewport: string | null;
  opengraphTitle: string | null;
  opengraphDescription: string | null;
  opengraphUrl: string | null;
  opengraphType: string | null;
  opengraphSiteName: string | null;
  opengraphLocale: string | null;
  twitterCard: string | null;
  twitterSite: string | null;
  twitterCreator: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterUrl: string | null;
  twitterDomain: string | null;
  twitterAppCountry: string | null;
}
