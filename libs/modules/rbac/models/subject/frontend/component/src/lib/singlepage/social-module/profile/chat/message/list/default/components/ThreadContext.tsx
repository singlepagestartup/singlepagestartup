"use client";

import { memo, type Ref } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type {
  ICustomerWorkView,
  ILinkedChatProduct,
} from "@sps/rbac/models/subject/sdk/model";
import type { IThreadMessagesScope } from "../hooks/use-thread-messages";
import { ThreadContextCard } from "./ThreadContextCard";
import { ThreadCustomerWork } from "./ThreadCustomerWork";
import { ThreadFiles } from "./ThreadFiles";

interface IProps extends IThreadMessagesScope {
  isCustomerWork: boolean;
  work?: ICustomerWorkView;
  products?: ILinkedChatProduct[];
  language: string;
  resultSectionRef: Ref<HTMLElement>;
  selectedVersionId?: string;
  onVersionSelect: (id: string) => void;
}

export const ThreadContext = memo(function ThreadContext(props: IProps) {
  const ru = props.language === "ru";
  const products = props.products?.filter(
    ({ slug }) => slug !== props.work?.productSlug,
  );
  const workProduct = props.products?.find(
    ({ slug }) => slug === props.work?.productSlug,
  );

  return (
    <div className="grid min-w-0 gap-3">
      <ThreadFiles
        isCustomerWork={props.isCustomerWork}
        subjectId={props.subjectId}
        socialModuleProfileId={props.socialModuleProfileId}
        socialModuleChatId={props.socialModuleChatId}
        socialModuleThreadId={props.socialModuleThreadId}
        language={props.language}
      />
      {props.work && (
        <ThreadCustomerWork
          subjectId={props.subjectId}
          work={props.work}
          productTitle={
            props.work.productTitle?.[props.language]?.trim() ||
            workProduct?.title?.[props.language]?.trim() ||
            props.work.productSlug
          }
          language={props.language}
          resultSectionRef={props.resultSectionRef}
          selectedVersionId={props.selectedVersionId}
          onVersionSelect={props.onVersionSelect}
        />
      )}
      {!!products?.length && (
        <ThreadContextCard
          icon={Package}
          title={ru ? "Товары и услуги" : "Products and services"}
        >
          <ul className="grid gap-1">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/${props.language}/ecommerce/products/${encodeURIComponent(product.slug)}`}
                  className="inline-flex min-h-9 items-center break-words rounded-md text-sm underline underline-offset-4"
                >
                  {product.title?.[props.language]?.trim() || product.slug}
                </Link>
              </li>
            ))}
          </ul>
        </ThreadContextCard>
      )}
    </div>
  );
});
