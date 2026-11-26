import type { ComponentType, ReactNode } from "react";

export interface IStoreTableParams {
  search: string;
  offset: number;
  limit: number;
}

export const firstPage: Readonly<IStoreTableParams> = {
  search: "",
  offset: 0,
  limit: 10,
};

export interface IStoreTablePage<T> {
  items: T[];
  total: number;
}

export interface IStoreTableQuery<T> {
  data?: IStoreTablePage<T>;
  denied?: boolean;
  showAction?: boolean;
  isError: boolean;
  refetch: () => unknown;
}

export interface IStoreTableViewProps {
  language: string;
  title?: ReactNode;
  action?: ReactNode;
  header?: ReactNode;
  searchPlaceholder?: string;
  emptyMessage: string;
  deniedMessage: string;
  className?: string;
  listClassName?: string;
}

export interface IClientReaderProps<T> extends IStoreTableViewProps {
  initialData?: IStoreTablePage<T>;
  usePage: (
    params: IStoreTableParams,
    initialData?: IStoreTablePage<T>,
  ) => IStoreTableQuery<T>;
  renderRow: (item: T) => ReactNode;
}

export interface IServerReaderProps<T> {
  language: string;
  readPage: (params: IStoreTableParams) => Promise<IStoreTablePage<T>>;
  renderClient: (initialData: IStoreTablePage<T>) => ReactNode;
}

export type IComponentProps<T> = {
  Provider?: ComponentType<{ children: ReactNode }>;
} & (
  | ({ isServer: false } & IClientReaderProps<T>)
  | ({ isServer: true } & IServerReaderProps<T>)
);
