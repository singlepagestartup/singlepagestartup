import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <Link
      data-module="ecommerce"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      href={`${props.language === internationalization.defaultLanguage.code ? "" : "/" + props.language}/ecommerce/categories/${props.data.slug}`}
      className={cn("flex flex-col w-full cursor-pointer", props.className)}
    >
      <Card className="w-full flex flex-col hover:border-primary duration-300">
        <CardHeader className="flex flex-col gap-1">
          {props.data.title ? (
            <CardTitle className="font-bold lg:text-2xl">
              {props.data.title?.[props.language]}
            </CardTitle>
          ) : null}
        </CardHeader>
        <CardContent>
          {props.data.subtitle?.[props.language] ? (
            <TipTap
              value={props.data.subtitle[props.language] || ""}
              className="prose:text-secondary"
            />
          ) : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline">
            <p>More</p>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
