import { State, Action } from './use-toast';

const TOAST_LIMIT = 10;

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
      case "ADD_TOAST":
        return {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        }
  
      case "UPDATE_TOAST":
        return {
          ...state,
          toasts: state.toasts.map((t) => 
            t.id === action.toast.id ? { ...t, ...action.toast } : t
          ),
        }
  
      case "DISMISS_TOAST": {
        const { toastId } = action
  
        
  
        return {
          ...state,
          toasts: state.toasts.map((t) => 
            t.id === toastId || toastId === undefined
              ? {
                  ...t,
                  open: false,
                }
              : t
          ),
        }
      }
      case "REMOVE_TOAST":
        if (action.toastId === undefined) {
          return {
            ...state,
            toasts: [],
          }
        }
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        }
      default:
        return state
    }
  }