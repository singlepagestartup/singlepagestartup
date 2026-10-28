import type { IComponentProps, IProfileCreateContentProps } from "./interface";
export type { IProfileCreateContentProps } from "./interface";
import type { ReactNode } from "react";

export function Component({
  variant = "content-ai-chat-profile-create",
  children,
}: IComponentProps) {
  return (
    <main
      className="mx-auto max-w-6xl px-4 py-6 @[640px]:px-5"
      data-module="website-builder"
      data-model="widget"
      data-variant={variant}
    >
      <div className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card @[760px]:grid-cols-2">
        <section className="flex flex-col justify-center p-6 @[640px]:p-10">
          <span className="mb-5 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
          <h1 className="text-3xl font-semibold leading-tight">
            Начните с названия
          </h1>
          <p className={`mt-4 text-sm leading-6 ${"text-muted-foreground"}`}>
            Создайте проект с брифом, стратегией, брендом, дизайном и описанием
            продуктов. Начните с брифа, добавляйте знания и файлы по мере
            работы.
          </p>
          {children}
        </section>
        <div className="relative hidden min-w-0 @[760px]:block">
          <img
            src="/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-project-start-v1-square.png"
            alt="Человек работает над своим проектом за столом"
            loading="lazy"
            className="h-full min-h-96 w-full rounded-none object-cover"
          />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-default p-5 text-default-foreground">
            <p className="font-semibold">Ваши файлы и ваш проект</p>
            <p className="mt-2 text-sm leading-6 text-default-foreground/70">
              Опишите бизнес, приложите нужные файлы и работайте с помощником в
              своём проекте.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
