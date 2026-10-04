import { useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { EcommerceProductAdminV2SelectInput } from "../../../../models/product/singlepage/admin-v2-select-input/Component";
import { EcommerceAttributeAdminV2SelectInput } from "../../../../models/attribute/singlepage/admin-v2-select-input/Component";
import { EcommerceProductAdminV2Form } from "../../../../models/product/singlepage/admin-v2-form/Component";
import { EcommerceAttributeAdminV2Form } from "../../../../models/attribute/singlepage/admin-v2-form/Component";
import {
  Records,
  RecordEditor,
  RecordForm,
  type IRecordField,
} from "../../../../../../workspace/design/singlepage/interface-kit/Records";
import {
  studioProducts,
  type IStudioProduct,
} from "../../../../models/product/shared";
import {
  studioAttributes,
  type IStudioAttribute,
} from "../../../../models/attribute/shared";

export interface IStudioRelation {
  id: string;
  productId: string;
  attributeId: string;
  orderIndex: number;
  variant: string;
  className: string;
}
export interface IRelationManagerProps {
  productId?: string;
  embedded?: boolean;
  products?: IStudioProduct[];
  attributes?: IStudioAttribute[];
  relations?: IStudioRelation[];
  onProductsChange?: (products: IStudioProduct[]) => void;
  onAttributesChange?: (attributes: IStudioAttribute[]) => void;
  onRelationsChange?: (relations: IStudioRelation[]) => void;
}
export const initialProductAttributeRelations: IStudioRelation[] =
  studioAttributes.slice(0, 3).map((attribute, orderIndex) => ({
    id: `relation_${attribute.id}`,
    productId: "product_website",
    attributeId: attribute.id,
    orderIndex,
    variant: "default",
    className: "",
  }));

export function EcommerceProductsToAttributesAdminV2Manager({
  productId = "product_website",
  embedded = false,
  products: controlledProducts,
  attributes: controlledAttributes,
  relations: controlledRelations,
  onProductsChange,
  onAttributesChange,
  onRelationsChange,
}: IRelationManagerProps = {}) {
  const [localProducts, setLocalProducts] = useState(studioProducts);
  const [localAttributes, setLocalAttributes] = useState(studioAttributes);
  const [localRelations, setLocalRelations] = useState(
    initialProductAttributeRelations,
  );
  const products = controlledProducts ?? localProducts;
  const attributes = controlledAttributes ?? localAttributes;
  const relations = controlledRelations ?? localRelations;
  const [draft, setDraft] = useState<IStudioRelation | null>(null);
  const [attributeDraft, setAttributeDraft] = useState<IStudioAttribute | null>(
    null,
  );
  const [productDraft, setProductDraft] = useState<IStudioProduct | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  const changeRelations = useCallback(
    (next: IStudioRelation[]) => {
      setLocalRelations(next);
      onRelationsChange?.(next);
    },
    [onRelationsChange],
  );
  const edit = useCallback((relation: IStudioRelation) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setDraft({ ...relation });
    setError("");
  }, []);
  const unlink = useCallback(
    (ids: string[]) => {
      changeRelations(relations.filter((item) => !ids.includes(item.id)));
      setStatus(
        "Relation removed locally. Both endpoint records remain available.",
      );
    },
    [relations, changeRelations],
  );
  const editAttribute = useCallback(
    (relation: IStudioRelation) => {
      const record = attributes.find(
        (item) => item.id === relation.attributeId,
      );
      if (record) {
        setAttributeDraft(record);
      }
    },
    [attributes],
  );
  const editProduct = useCallback(
    (relation: IStudioRelation) => {
      const record = products.find((item) => item.id === relation.productId);
      if (record) {
        setProductDraft(record);
      }
    },
    [products],
  );
  const fields = useMemo<IRecordField<IStudioRelation>[]>(
    () => [
      {
        key: "attributeId",
        label: "Attribute",
        value: (record) => record.attributeId,
        displayValue: (record) =>
          `${attributes.find((item) => item.id === record.attributeId)?.adminTitle ?? "Attribute"} · ${record.attributeId}`,
      },
      {
        key: "productId",
        label: "Product",
        value: (record) => record.productId,
        displayValue: (record) =>
          `${products.find((item) => item.id === record.productId)?.adminTitle ?? "Product"} · ${record.productId}`,
      },
      {
        key: "orderIndex",
        label: "Order index",
        value: (record) => String(record.orderIndex),
      },
      { key: "id", label: "Relation ID", value: (record) => record.id },
      { key: "variant", label: "Variant", value: (record) => record.variant },
    ],
    [attributes, products],
  );
  const searchFields = useMemo(
    () => [
      ...fields,
      {
        key: "className",
        label: "Class name",
        value: (record: IStudioRelation) => record.className,
      },
    ],
    [fields],
  );
  const actions = useMemo(
    () => [
      {
        label: "Edit relation",
        icon: "pencil-simple" as const,
        onAction: edit,
      },
      {
        label: "Attribute",
        icon: "tag" as const,
        onAction: editAttribute,
      },
      {
        label: "Product",
        icon: "cube" as const,
        onAction: editProduct,
      },
    ],
    [edit, editAttribute, editProduct],
  );
  const visible = relations
    .filter((item) => item.productId === productId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const endpointPanels = (
    <>
      <RecordEditor
        open={Boolean(attributeDraft)}
        onOpenChange={(open) => {
          if (!open) setAttributeDraft(null);
        }}
        title="Edit attribute"
        description="Attribute fields belong to the endpoint record; the relation keeps its own fields."
      >
        {attributeDraft && (
          <EcommerceAttributeAdminV2Form
            key={attributeDraft.id}
            attribute={attributeDraft}
            embedded
            onSave={(attribute) => {
              const next = attributes.map((item) =>
                item.id === attribute.id ? attribute : item,
              );
              setLocalAttributes(next);
              onAttributesChange?.(next);
              setAttributeDraft(null);
              setStatus("Attribute updated locally.");
            }}
          />
        )}
      </RecordEditor>
      <RecordEditor
        open={Boolean(productDraft)}
        onOpenChange={(open) => {
          if (!open) setProductDraft(null);
        }}
        title="Edit product"
        description="Product fields belong to the endpoint record; its relations remain separate."
      >
        {productDraft && (
          <EcommerceProductAdminV2Form
            key={productDraft.id}
            product={productDraft}
            embedded
            onSave={(product) => {
              const next = products.map((item) =>
                item.id === product.id ? product : item,
              );
              setLocalProducts(next);
              onProductsChange?.(next);
              setProductDraft(null);
              setStatus("Product updated locally.");
            }}
          />
        )}
      </RecordEditor>
    </>
  );
  return (
    <section
      className="min-w-0"
      data-ds-block="ecommerce.relation.products-to-attributes.admin-v2-manager"
      data-ds-imports="ecommerce.product.admin-v2-select-input,ecommerce.attribute.admin-v2-select-input,ecommerce.product.admin-v2-form,ecommerce.attribute.admin-v2-form"
      data-ds-layer="singlepage"
    >
      <Records
        embedded={embedded}
        compactActions
        title="Product attributes"
        scope="ecommerce / products-to-attributes"
        records={visible}
        fields={fields}
        searchFields={searchFields}
        actions={actions}
        createLabel="Link attribute"
        removalLabel="Unlink"
        removalDescription="Remove the selected links? Product and attribute records remain available."
        onRemove={unlink}
        onCreate={() => {
          returnFocus.current = document.activeElement as HTMLElement;
          setDraft({
            id: "",
            productId,
            attributeId: "",
            orderIndex: visible.length
              ? Math.max(...visible.map((item) => item.orderIndex)) + 1
              : 0,
            variant: "default",
            className: "",
          });
          setError("");
        }}
      />
      <RecordEditor
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) {
            setDraft(null);
            setAttributeDraft(null);
            setProductDraft(null);
          }
        }}
        title={draft?.id ? "Edit relation" : "Link a record"}
        description="Change this link’s fields. Product and attribute records remain separate."
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        {draft && (
          <RecordForm
            onSubmit={(event) => {
              event.preventDefault();
              if (
                relations.some(
                  (item) =>
                    item.id !== draft.id &&
                    item.productId === draft.productId &&
                    item.attributeId === draft.attributeId,
                )
              ) {
                setError(
                  "This attribute is already linked to the selected product.",
                );
                return;
              }
              const saved = {
                ...draft,
                id: draft.id || `relation_${crypto.randomUUID()}`,
              };
              changeRelations(
                draft.id
                  ? relations.map((item) =>
                      item.id === draft.id ? saved : item,
                    )
                  : [...relations, saved],
              );
              setStatus(
                draft.id
                  ? "Relation updated locally."
                  : "Relation created locally.",
              );
              setDraft(null);
            }}
            footer={
              <>
                <Button variant="secondary" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!draft.productId || !draft.attributeId}
                >
                  <Icon name="floppy-disk" />
                  Save relation
                </Button>
              </>
            }
          >
            <div className="grid gap-5">
              {draft.id && (
                <p className={`break-all text-xs ${kit.muted}`}>
                  Relation ID: {draft.id}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid content-start gap-3">
                  <EcommerceProductAdminV2SelectInput
                    records={products}
                    value={draft.productId}
                    onValueChange={(value) => {
                      if (value)
                        setDraft((current) =>
                          current ? { ...current, productId: value } : current,
                        );
                    }}
                  />
                </div>
                <div className="grid content-start gap-3">
                  <EcommerceAttributeAdminV2SelectInput
                    records={attributes}
                    value={draft.attributeId}
                    onValueChange={(value) => {
                      if (value)
                        setDraft((current) =>
                          current
                            ? { ...current, attributeId: value }
                            : current,
                        );
                    }}
                  />
                </div>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Order index</span>
                  <input
                    className={kit.field}
                    type="number"
                    step={1}
                    required
                    value={draft.orderIndex}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        orderIndex: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Variant</span>
                  <Select
                    value={draft.variant}
                    onValueChange={(variant) => setDraft({ ...draft, variant })}
                    options={[{ value: "default", label: "Default" }]}
                  />
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className={kit.label}>Class name</span>
                  <input
                    className={kit.field}
                    value={draft.className}
                    onChange={(event) =>
                      setDraft({ ...draft, className: event.target.value })
                    }
                  />
                </label>
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-3 text-sm text-[var(--workspace-brand-danger)]"
                >
                  {error}
                </p>
              )}
            </div>
          </RecordForm>
        )}
      </RecordEditor>
      {endpointPanels}
      <p role="status" className={`mt-4 min-h-5 text-sm ${kit.muted}`}>
        {status}
      </p>
    </section>
  );
}
