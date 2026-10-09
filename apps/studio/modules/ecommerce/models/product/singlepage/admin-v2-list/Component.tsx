import { useCallback, useMemo, useRef, useState } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { EcommerceProductAdminV2Form } from "../admin-v2-form/Component";
import { studioProducts, type IStudioProduct } from "../../shared";
import { Component as EcommerceModuleAttribute } from "../../../attribute/index";
import {
  Records,
  RecordEditor,
  type IRecordField,
} from "../../../../../../workspace/design/singlepage/interface-kit/Records";
const fields: IRecordField<IStudioProduct>[] = [
  {
    key: "adminTitle",
    label: "Admin title",
    value: (record) => record.adminTitle,
  },
  {
    key: "title",
    label: "Title",
    value: (record) => Object.values(record.title).join(" "),
    displayValue: (record) =>
      record.title.en ?? Object.values(record.title)[0] ?? "",
  },
  { key: "slug", label: "Slug", value: (record) => record.slug },
  { key: "id", label: "ID", value: (record) => record.id },
  { key: "type", label: "Type", value: (record) => record.type },
  { key: "variant", label: "Variant", value: (record) => record.variant },
];
export interface IProductAdminListProps {
  initialProduct?: IStudioProduct;
}
export function EcommerceProductAdminV2List({
  initialProduct,
}: IProductAdminListProps = {}) {
  const [products, setProducts] = useState(studioProducts);
  const [editing, setEditing] = useState<IStudioProduct | null>(
    initialProduct ?? null,
  );
  const [preview, setPreview] = useState<IStudioProduct | null>(null);
  const [status, setStatus] = useState("");
  const changeProducts = useCallback(
    (next: IStudioProduct[]) => setProducts(next),
    [],
  );
  const returnFocus = useRef<HTMLElement | null>(null);
  const edit = useCallback((product: IStudioProduct) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setEditing({ ...product });
  }, []);
  const show = useCallback((product: IStudioProduct) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setPreview(product);
  }, []);
  const remove = useCallback((ids: string[]) => {
    setProducts((current) => current.filter((item) => !ids.includes(item.id)));
    setStatus("Selected records removed locally.");
  }, []);
  const actions = useMemo(
    () => [
      { label: "Preview", icon: "eye" as const, onAction: show },
      { label: "Edit", icon: "pencil-simple" as const, onAction: edit },
    ],
    [show, edit],
  );
  return (
    <section
      className="min-w-0"
      data-ds-block="ecommerce.product.admin-v2-list"
      data-ds-layer="singlepage"
    >
      <Records
        title="Products"
        scope="ecommerce / product"
        records={products}
        fields={fields}
        actions={actions}
        createLabel="Add product"
        onRemove={remove}
        onCreate={() => {
          returnFocus.current = document.activeElement as HTMLElement;
          setEditing({
            id: "",
            adminTitle: "",
            title: {},
            shortDescription: {},
            description: {},
            slug: "",
            type: "one_off",
            variant: "default",
          });
        }}
      />
      <p role="status" className={`px-5 pb-5 text-sm ${kit.muted}`}>
        {status}
      </p>
      <RecordEditor
        open={Boolean(editing || preview)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setPreview(null);
          }
        }}
        title={
          editing
            ? editing.id
              ? "Edit product"
              : "New product"
            : "Product preview"
        }
        description="Example data stays in this preview and resets when it reloads."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {editing ? (
          <EcommerceProductAdminV2Form
            key={editing.id || "new"}
            product={editing}
            embedded
            attributes={<EcommerceModuleAttribute variant="list" />}
            onSave={(product) => {
              const saved = {
                ...product,
                id: product.id || `product_${crypto.randomUUID()}`,
              };
              setProducts((current) =>
                product.id
                  ? current.map((item) =>
                      item.id === product.id ? saved : item,
                    )
                  : [saved, ...current],
              );
              setEditing(null);
              setStatus("Product saved locally.");
            }}
          />
        ) : preview ? (
          <div className="p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{preview.title.en}</h3>
            <p className={`mt-3 ${kit.muted}`}>{preview.description.en}</p>
            <p className={`mt-4 break-all text-xs ${kit.muted}`}>
              {preview.id} · {preview.slug}
            </p>
          </div>
        ) : null}
      </RecordEditor>
    </section>
  );
}
