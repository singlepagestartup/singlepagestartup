import {
  StartupWidgetDefault,
  type StartupWidgetDefaultProps,
} from "../../singlepage/default/StartupWidgetDefault";

export const startupWidgetOverrideProps: StartupWidgetDefaultProps = {
  label: "Startup layer",
  title: "SinglePageStartup as the current project shell.",
  description:
    "This override shows how a downstream startup can keep the module contract and change the actual business message.",
  metrics: [
    {
      label: "Prototype routes",
      value: "8",
    },
    {
      label: "Reusable blocks",
      value: "Live",
    },
    {
      label: "Designer handoff",
      value: "Figma",
    },
  ],
};

export function StartupWidgetStartup(
  props: Partial<StartupWidgetDefaultProps>,
) {
  return <StartupWidgetDefault {...startupWidgetOverrideProps} {...props} />;
}
