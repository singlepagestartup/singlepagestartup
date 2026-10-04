import { useId, useState, type ReactNode } from "react";
import {
  SectionTabsRoot,
  SectionTabsList,
  SectionTabsTrigger,
  SectionTabsContent,
} from "../../../../../../workspace/design/singlepage/interface-kit/Tabs";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { RecordForm } from "../../../../../../workspace/design/singlepage/interface-kit/Records";
import { studioProducts, type IStudioProduct } from "../../shared";
export interface IProductRelationSection {
  id: string;
  title: string;
  render: (props: { product: IStudioProduct }) => ReactNode;
}
export interface IProductAdminFormProps {
  product?: IStudioProduct;
  onSave?: (product: IStudioProduct) => void;
  relations?: ReactNode;
  relationSections?: IProductRelationSection[];
  embedded?: boolean;
}
export function EcommerceProductAdminV2Form({
  product = studioProducts[0],
  onSave,
  relations,
  relationSections,
  embedded = false,
}: IProductAdminFormProps = {}) {
  const [draft, setDraft] = useState(product);
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const id = useId();
  const sections =
    relationSections ??
    (relations
      ? [
          {
            id: "products-to-attributes",
            title: "Attributes",
            render: () => relations,
          },
        ]
      : []);
  const [activeRelation, setActiveRelation] = useState("");
  const [relationQuery, setRelationQuery] = useState("");
  const selectedRelation =
    sections.find((section) => section.id === activeRelation) ?? sections[0];
  const matchingSections = sections.filter((section) =>
    section.title.toLowerCase().includes(relationQuery.trim().toLowerCase()),
  );
  const selectableSections =
    selectedRelation && !matchingSections.includes(selectedRelation)
      ? [selectedRelation, ...matchingSections]
      : matchingSections;
  return (
    <section
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : `${kit.card} overflow-hidden p-0`
      }
      data-ds-block="ecommerce.product.admin-v2-form"
      data-ds-layer="singlepage"
    >
      {!embedded && (
        <header className="shrink-0 border-b border-[var(--workspace-brand-line)] p-5 sm:p-6">
          <p className={`text-xs ${kit.muted}`}>ecommerce / product</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {product.id ? "Edit product" : "New product"}
          </h2>
          <p className={`mt-2 break-all text-xs ${kit.muted}`}>
            {product.id || "A local ID is assigned when you save."}
          </p>
        </header>
      )}
      <RecordForm
        id={`${id}-form`}
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(draft);
          setStatus("Product saved locally. Changes reset on reload.");
        }}
        footer={
          <>
            <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
              {status || "Local preview"}
            </p>
            <Button type="submit">
              <Icon name="floppy-disk" />
              {product.id ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      >
        <SectionTabsRoot value={activeTab} onValueChange={setActiveTab}>
          <SectionTabsList aria-label="Product form sections" className="mb-5">
            <SectionTabsTrigger value="details">Details</SectionTabsTrigger>
            <SectionTabsTrigger
              value="relations"
              disabled={!sections.length || !product.id}
            >
              Relations{sections.length ? ` (${sections.length})` : ""}
            </SectionTabsTrigger>
          </SectionTabsList>
          <SectionTabsContent
            value="details"
            forceMount
            className="data-[state=inactive]:hidden focus:outline-none"
          >
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Admin title</span>
                  <input
                    className={kit.field}
                    required
                    value={draft.adminTitle}
                    onChange={(event) =>
                      setDraft({ ...draft, adminTitle: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Slug</span>
                  <input
                    className={kit.field}
                    required
                    pattern="[a-z0-9-]+"
                    value={draft.slug}
                    onChange={(event) =>
                      setDraft({ ...draft, slug: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Type</span>
                  <Select
                    value={draft.type}
                    onValueChange={(value) =>
                      setDraft({ ...draft, type: value })
                    }
                    options={[
                      { value: "one_off", label: "One-off" },
                      { value: "subscription", label: "Subscription" },
                    ]}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>Variant</span>
                  <Select
                    value={draft.variant}
                    onValueChange={(value) =>
                      setDraft({ ...draft, variant: value })
                    }
                    options={[{ value: "default", label: "Default" }]}
                  />
                </label>
              </div>
              <fieldset className="grid gap-4 rounded-2xl bg-[var(--workspace-brand-background)] p-4 sm:p-5">
                <legend className="sr-only">Localized content</legend>
                <h3 className="font-semibold">Localized content</h3>
                <label className="grid max-w-xs gap-2 text-sm">
                  <span className={kit.label}>Language</span>
                  <Select
                    value={language}
                    onValueChange={setLanguage}
                    options={[
                      { value: "en", label: "English" },
                      { value: "ru", label: "Русский" },
                    ]}
                  />
                </label>
                <label htmlFor={`${id}-title`} className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Title · {language.toUpperCase()}
                  </span>
                  <input
                    id={`${id}-title`}
                    className={kit.field}
                    required
                    value={draft.title[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        title: {
                          ...draft.title,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Short description · {language.toUpperCase()}
                  </span>
                  <input
                    className={kit.field}
                    value={draft.shortDescription[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        shortDescription: {
                          ...draft.shortDescription,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className={kit.label}>
                    Description · {language.toUpperCase()}
                  </span>
                  <textarea
                    className={`${kit.field} min-h-28`}
                    value={draft.description[language] ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        description: {
                          ...draft.description,
                          [language]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              </fieldset>
            </div>
          </SectionTabsContent>
          <SectionTabsContent
            value="relations"
            forceMount
            className="data-[state=inactive]:hidden focus:outline-none"
          >
            {selectedRelation && (
              <div className="grid min-w-0 gap-5">
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <label className="grid min-w-0 gap-2 text-sm">
                    <span className={kit.label}>Filter relation groups</span>
                    <input
                      type="search"
                      className={kit.field}
                      placeholder="Search by group name"
                      value={relationQuery}
                      onChange={(event) => setRelationQuery(event.target.value)}
                    />
                  </label>
                  <label className="grid min-w-0 gap-2 text-sm">
                    <span className={kit.label}>Relation group</span>
                    <Select
                      value={selectedRelation.id}
                      onValueChange={(value) => {
                        if (value) setActiveRelation(value);
                      }}
                      options={selectableSections.map((section) => ({
                        value: section.id,
                        label: section.title,
                      }))}
                    />
                  </label>
                </div>
                <p role="status" className={`text-xs ${kit.muted}`}>
                  {relationQuery
                    ? `${matchingSections.length} matching groups · ${sections.length} available`
                    : `${sections.length} relation groups available`}
                </p>
                {sections.map((section) => (
                  <div
                    key={section.id}
                    hidden={section.id !== selectedRelation.id}
                    aria-label={`${section.title} relations`}
                  >
                    {section.render({ product })}
                  </div>
                ))}
              </div>
            )}
          </SectionTabsContent>
        </SectionTabsRoot>
      </RecordForm>
    </section>
  );
}
