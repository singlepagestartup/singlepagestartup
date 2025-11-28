import { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
import { Component as SlidersToSlides } from "@sps/website-builder/relations/sliders-to-slides/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <SlidersToSlides
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "sliderId",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return (
          <ClientComponent
            isServer={props.isServer}
            variant={props.variant}
            data={props.data}
            language={props.language}
            className={props.className}
            sliderToSlides={data?.map((entity, index) => {
              return (
                <SlidersToSlides
                  key={index}
                  isServer={props.isServer}
                  variant={entity.variant as any}
                  data={entity}
                  language={props.language}
                />
              );
            })}
          />
        );
      }}
    </SlidersToSlides>
  );
}
