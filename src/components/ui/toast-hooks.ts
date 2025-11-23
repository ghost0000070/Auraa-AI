import * as React from "react"
import { reducer } from './toast-logic';
import { State, Action, Toast } from './use-toast';

let memoryState: State = { toasts: [] };

const listeners: Array<(state: State) => void> = []

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => {
      listener(memoryState)
    })
  }

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}


export function toast(props: Toast) {
    const id = genId()
  
    const update = (props: Partial<Toast>) => dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss()
        },
      },
    })
  
    return {
      id,
      dismiss,
      update,
    }
  }
  
  export function useToast() {
    const [state, setState] = React.useState<State>(memoryState)
  
    React.useEffect(() => {
      listeners.push(setState)
      return () => {
        const index = listeners.indexOf(setState)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }, [state])
  
    return {
      ...state,
      toast,
      dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    }
  }