import {
  cn,
  getRichTextPlainText,
  getRichTextMarkdown,
} from "@sps/shared-frontend-client-utils";
import { Component as WidgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/frontend/component";
import { Component as FeaturesToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as Feature } from "@sps/website-builder/models/feature/frontend/component";
import { Component as Demo } from "./ClientComponent";
import { internationalization } from "@sps/shared-configuration";
import type {
  IComponentPropsExtended,
  ISectionsProps,
  IDemoContentProps,
  IDemoFiles,
} from "./interface";

function DemoContent({ features, isServer, language }: IDemoContentProps) {
  const project = features.find(
    (feature) => feature.variant === "demo-project",
  );
  const documents = features.filter(
    (feature) => feature.variant === "demo-document",
  );
  const handoff = features.find(
    (feature) => feature.variant === "demo-handoff",
  );
  if (!project || !documents.length) return null;
  return (
    <FeaturesToFileStorageModuleFiles
      isServer={isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "featureId",
                method: "inArray",
                value: documents.map((doc) => doc.id),
              },
            ],
          },
          orderBy: {
            and: [
              { column: "orderIndex", method: "asc" },
              { column: "id", method: "asc" },
            ],
          },
          limit: 1000,
        },
      }}
    >
      {({ data: fileLinks }) => {
        const render = (files: IDemoFiles) => (
          <Demo
            key={language}
            language={language}
            projectTitle={project.title?.[language] || project.title?.en || ""}
            reply={getRichTextPlainText(
              project.subtitle?.[language] || project.subtitle?.en,
            )}
            settings={
              <Feature
                isServer={isServer}
                variant="demo-project"
                dataSource="props"
                data={project}
                language={language}
              />
            }
            handoff={
              handoff ? (
                <Feature
                  isServer={isServer}
                  variant="demo-handoff"
                  dataSource="props"
                  data={handoff}
                  language={language}
                />
              ) : undefined
            }
            documents={documents.map((doc) => {
              const text = getRichTextMarkdown(
                doc.description?.[language] || doc.description?.en,
              );
              return {
                key: doc.id,
                title: doc.title?.[language] || doc.title?.en || "",
                text,
                section:
                  text.match(/^#+\s+(.+)/m)?.[1] ||
                  doc.title?.[language] ||
                  doc.title?.en ||
                  "",
                intro: getRichTextPlainText(
                  doc.subtitle?.[language] || doc.subtitle?.en,
                ),
                files: (fileLinks || [])
                  .filter((link) => link.featureId === doc.id)
                  .flatMap((link) => {
                    const record = files.find(
                      (file) => file.id === link.fileStorageModuleFileId,
                    );
                    return record
                      ? [
                          {
                            id: record.id,
                            name: record.alt || record.adminTitle,
                            record,
                          },
                        ]
                      : [];
                  }),
              };
            })}
          />
        );
        if (!fileLinks) return null;
        if (!fileLinks.length) return render([]);
        return (
          <FileStorageModuleFile
            isServer={isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: fileLinks.map(
                        (link) => link.fileStorageModuleFileId,
                      ),
                    },
                  ],
                },
                limit: 1000,
              },
            }}
          >
            {({ data: files }) => (files ? render(files) : null)}
          </FileStorageModuleFile>
        );
      }}
    </FeaturesToFileStorageModuleFiles>
  );
}
function Sections({ links, features, isServer, language }: ISectionsProps) {
  const ordered = links.flatMap((link) => {
    const feature = features.find((item) => item.id === link.featureId);
    return feature ? [feature] : [];
  });
  return links.map((link) => {
    const feature = features.find((item) => item.id === link.featureId);
    if (!feature || feature.variant.startsWith("demo-")) return null;
    return (
      <WidgetsToFeatures
        key={link.id}
        isServer={isServer}
        variant="default"
        dataSource="props"
        data={link}
        language={language}
        className="block min-w-0"
      >
        {feature.variant === "landing-workflow" ? (
          <DemoContent
            features={ordered}
            isServer={isServer}
            language={language}
          />
        ) : undefined}
      </WidgetsToFeatures>
    );
  });
}
export function Component({
  language = internationalization.defaultLanguage.code,
  data,
  className,
  isServer,
}: IComponentPropsExtended) {
  return (
    <main
      id="ai-chat-main"
      data-module="website-builder"
      data-model="widget"
      data-variant="landing-ai-chat"
      data-id={data.id}
      className={cn("w-full min-w-0 pb-10", data.className, className)}
    >
      <WidgetsToFeatures
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: data.id }],
            },
            orderBy: {
              and: [
                { column: "orderIndex", method: "asc" },
                { column: "id", method: "asc" },
              ],
            },
            limit: 1000,
          },
        }}
      >
        {({ data: links }) =>
          !links?.length ? null : (
            <Feature
              isServer={isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "id",
                        method: "inArray",
                        value: links.map((link) => link.featureId),
                      },
                    ],
                  },
                  limit: 1000,
                },
              }}
            >
              {({ data: features }) =>
                features ? (
                  <Sections
                    links={links}
                    features={features}
                    language={language}
                    isServer={isServer}
                  />
                ) : null
              }
            </Feature>
          )
        }
      </WidgetsToFeatures>
    </main>
  );
}
