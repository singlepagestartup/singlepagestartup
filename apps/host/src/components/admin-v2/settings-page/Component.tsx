import Link from "next/link";
import { Bell, Clock3, Contact, ShieldCheck, ShoppingBag } from "lucide-react";
import { Badge, Button, Card } from "@sps/shared-ui-shadcn";
import { Component as Maintenance, TemplateExample } from "./ClientComponent";
import { copy, recommendations, securityTemplateExample } from "./data";
import type { ISettingsPageProps } from "./interface";

const icons = [ShieldCheck, Contact, Bell, ShoppingBag, Clock3];

export function Component(props: ISettingsPageProps) {
  const language = props.language === "ru" ? "ru" : "en";
  const text = copy[language];

  return (
    <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
      <section
        data-testid="settings-page"
        className="mx-auto max-w-7xl space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{text.settings}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {text.introduction}
          </p>
        </div>
        <Maintenance language={language} />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{text.setup}</h2>
          <p className="text-sm text-muted-foreground">
            {text.setupDescription}
          </p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {recommendations[language].map((item, index) => {
            const Icon = icons[index];
            return (
              <Card
                key={item.id}
                data-testid={`setup-${item.id}`}
                className="space-y-4 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border bg-muted p-2">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Badge variant="secondary">{text.recommendation}</Badge>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {item.steps.map((step) => (
                    <li key={step} className="break-words">
                      {step}
                    </li>
                  ))}
                </ol>
                {item.id === "security" && (
                  <TemplateExample
                    language={language}
                    content={securityTemplateExample[language]}
                  />
                )}
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {item.links.map((link) => (
                    <Button key={link.path} asChild variant="outline" size="sm">
                      <Link href={`/${language}/admin/${link.path}`}>
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
