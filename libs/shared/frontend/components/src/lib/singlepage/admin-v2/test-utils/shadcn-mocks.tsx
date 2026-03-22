import React, { useContext, useMemo, useState } from "react";

type TOverlayContext = {
  open: boolean;
  onOpenChange?: (value: boolean) => void;
};

function mergeClickHandlers(
  first?: (event: any) => void,
  second?: (event: any) => void,
) {
  return (event: any) => {
    first?.(event);
    second?.(event);
  };
}

function renderAsChild(children: React.ReactNode, props: Record<string, any>) {
  if (React.isValidElement(children)) {
    const childProps: any = (children as any).props || {};
    const nextProps = {
      ...props,
      ...childProps,
      onClick: mergeClickHandlers(props.onClick, childProps.onClick),
    };

    return React.cloneElement(children as any, nextProps);
  }

  return <span {...props}>{children}</span>;
}

const DialogContext = React.createContext<TOverlayContext>({ open: false });
const SheetContext = React.createContext<TOverlayContext>({ open: false });

const AlertDialogContext = React.createContext<{
  open: boolean;
  setOpen: (value: boolean) => void;
}>({
  open: false,
  setOpen: () => undefined,
});

const Button = ({ asChild, children, ...props }: any) => {
  if (asChild) {
    return renderAsChild(children, props);
  }

  return (
    <button {...props} type={props.type || "button"}>
      {children}
    </button>
  );
};

const Dialog = ({ open = false, onOpenChange, children }: any) => {
  const value = useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
};

const DialogTrigger = ({ asChild, children }: any) => {
  const ctx = useContext(DialogContext);
  const onClick = () => ctx.onOpenChange?.(true);

  if (asChild) {
    return renderAsChild(children, { onClick });
  }

  return <button onClick={onClick}>{children}</button>;
};

const DialogContent = ({ children, ...props }: any) => {
  const ctx = useContext(DialogContext);
  if (!ctx.open) {
    return null;
  }

  return <div {...props}>{children}</div>;
};

const Sheet = ({ open = false, onOpenChange, children }: any) => {
  const value = useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);

  return (
    <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
  );
};

const SheetTrigger = ({ asChild, children }: any) => {
  const ctx = useContext(SheetContext);
  const onClick = () => ctx.onOpenChange?.(true);

  if (asChild) {
    return renderAsChild(children, { onClick });
  }

  return <button onClick={onClick}>{children}</button>;
};

const SheetContent = ({ children, ...props }: any) => {
  const ctx = useContext(SheetContext);
  if (!ctx.open) {
    return null;
  }

  return <div {...props}>{children}</div>;
};

const AlertDialog = ({ children }: any) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger = ({ asChild, children }: any) => {
  const ctx = useContext(AlertDialogContext);
  const onClick = () => ctx.setOpen(true);

  if (asChild) {
    return renderAsChild(children, { onClick });
  }

  return <button onClick={onClick}>{children}</button>;
};

const AlertDialogContent = ({ children, ...props }: any) => {
  const ctx = useContext(AlertDialogContext);
  if (!ctx.open) {
    return null;
  }

  return <div {...props}>{children}</div>;
};

const AlertDialogAction = ({ children, onClick, ...props }: any) => {
  const ctx = useContext(AlertDialogContext);

  return (
    <button
      {...props}
      data-testid="alert-action"
      onClick={(event) => {
        onClick?.(event);
        ctx.setOpen(false);
      }}
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children, ...props }: any) => {
  const ctx = useContext(AlertDialogContext);

  return (
    <button
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        ctx.setOpen(false);
      }}
    >
      {children}
    </button>
  );
};

export const adminV2ShadcnMocks = {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger,
  Button,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Dialog,
  DialogContent,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogTrigger,
  Form: ({ children }: any) => <form>{children}</form>,
  Input: (props: any) => <input {...props} />,
  ScrollArea: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Select: ({ children, value, onValueChange }: any) => (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  Sheet,
  SheetContent,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetTrigger,
};
