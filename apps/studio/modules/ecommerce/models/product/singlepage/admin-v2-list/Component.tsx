import { useCallback, useMemo, useRef, useState } from "react";
import {
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { EcommerceProductAdminV2Form } from "../admin-v2-form/Component";
import { studioProducts, type IStudioProduct } from "../../shared";
import { studioAttributes } from "../../../attribute/shared";
import {
  EcommerceProductsToAttributesAdminV2Manager,
  initialProductAttributeRelations,
} from "../../../../relations/products-to-attributes/singlepage/admin-v2-manager/Component";
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
  const [attributes, setAttributes] = useState(studioAttributes);
  const [relations, setRelations] = useState(initialProductAttributeRelations);
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
            relationSections={[
              {
                id: "products-to-attributes",
                title: "Attributes",
                render: () => (
                  <EcommerceProductsToAttributesAdminV2Manager
                    embedded
                    productId={editing.id}
                    products={products}
                    attributes={attributes}
                    relations={relations}
                    onProductsChange={changeProducts}
                    onAttributesChange={setAttributes}
                    onRelationsChange={setRelations}
                  />
                ),
              },
              ...[
                {
                  id: "orders-to-products",
                  title: "Orders",
                  endpoint: "Order",
                  fields: "Quantity · Order index · Variant · Class name",
                },
                {
                  id: "categories-to-products",
                  title: "Categories",
                  endpoint: "Category",
                  fields: "Order index · Variant · Class name",
                },
                {
                  id: "stores-to-products",
                  title: "Stores",
                  endpoint: "Store",
                  fields: "Order index · Variant · Class name",
                },
                {
                  id: "widgets-to-products",
                  title: "Widgets",
                  endpoint: "Ecommerce widget",
                  fields: "Order index · Variant · Class name",
                },
                {
                  id: "products-to-file-storage-module-files",
                  title: "Files",
                  endpoint: "File",
                  fields: "Order index · Variant · Class name",
                },
                {
                  id: "products-to-website-builder-module-widgets",
                  title: "Website widgets",
                  endpoint: "Website widget",
                  fields: "Order index · Variant · Class name",
                },
              ].map((group) => ({
                id: group.id,
                title: group.title,
                render: () => (
                  <Records
                    embedded
                    title={group.title}
                    scope={`ecommerce / ${group.id}`}
                    records={[]}
                    fields={[]}
                    actions={[]}
                    emptyState={
                      <div className="grid min-w-0 gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
                        <div className="grid justify-items-center gap-3 rounded-2xl bg-[var(--workspace-brand-background)] p-6 text-center">
                          <Icon name="link" />
                          <p className="font-semibold">
                            No {group.title.toLowerCase()} links supplied
                          </p>
                          <p className={`max-w-md text-sm ${kit.muted}`}>
                            This local preview has no example links for this
                            group. Attributes contains editable example links.
                          </p>
                        </div>
                        <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className={kit.muted}>Linked records</dt>
                            <dd className="mt-1">Product · {group.endpoint}</dd>
                          </div>
                          <div>
                            <dt className={kit.muted}>Relation fields</dt>
                            <dd className="mt-1">{group.fields}</dd>
                          </div>
                        </dl>
                      </div>
                    }
                  />
                ),
              })),
            ]}
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
