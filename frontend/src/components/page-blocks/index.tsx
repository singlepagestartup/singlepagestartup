"use client";

import { Dispatch, FC, SetStateAction } from "react";
import { IBackendPageBlock } from "types/components/page-blocks";
import { pageBlockComponents } from "~utils/api/components";

export interface IPageBlockBlock {
  pageBlocks?: IBackendPageBlock[] | null;
  showSkeletons?: boolean;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
}

export default function PageBlocks(props: IPageBlockBlock) {
  return (
    <div className="page-blocks">
      {props.pageBlocks?.length
        ? props.pageBlocks.map((pageBlock, index) => {
            const key = pageBlock.__component;
            const PageBlock = pageBlockComponents[key] as FC<any>;

            if (!PageBlock) {
              return <div key={`${index}-${key}`}></div>;
            }

            return (
              <PageBlock
                pageProps={props}
                {...pageBlock}
                showSkeletons={props.showSkeletons}
                key={`${index}-${key}`}
              />
            );
          })
        : null}
    </div>
  );
}
