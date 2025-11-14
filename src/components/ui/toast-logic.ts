'''import * as React from "react"

type ToasterToast = Required<
  Pick<
    ToastProps,
    "id" | "title" | "description" | "action"
  >
> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 10;
const TOAST_REMOVE_DELAY = 1000000;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

interface ToastProps extends React.ComponentPropsWithoutRef<typeof Toast> {
  // Add any additional props if necessary
}

let memoryState: State = { toasts: [] };

const listeners: Array<(state: State) => void> = [];

export const toast = (props: ToasterToast) => {
  const toast = { ...props, id: Math.random().toString(36).substr(2, 9) };
  memoryState = reducer(memoryState, { type: "ADD_TOAST", toast });
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

export const dismiss = (id: string) => {
  memoryState = reducer(memoryState, { type: "DISMISS_TOAST", toastId: id });
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

interface State {
  toasts: ToasterToast[];
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
};''