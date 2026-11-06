export const variant = "me-authentication-ethereum-virtual-machine-default";

export interface IEthereumVirtualMachineProps {
  variant?: "me-authentication-ethereum-virtual-machine-default";
  initialState?: "idle" | "authorize" | "complete" | "error";
  walletAddress?: string;
  onSuccess?: () => void;
}

type IVariantInputs = NonNullable<IEthereumVirtualMachineProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-ethereum-virtual-machine-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
