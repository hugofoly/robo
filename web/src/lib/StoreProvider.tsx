import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createStore, type Actions, type AppState, type Store } from './store'

const StoreContext = createContext<Store | null>(null)

/** Um store por carregamento da página: recarregar começa do zero. */
export function StoreProvider({ children, store }: { children: ReactNode; store?: Store }) {
  const [value] = useState(() => store ?? createStore())
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function useStoreInstance(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('StoreProvider ausente')
  return store
}

/** Lê uma fatia do estado. O seletor deve devolver referências do próprio estado (ou primitivos). */
export function useAppState<T>(selector: (s: AppState) => T): T {
  const store = useStoreInstance()
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}

export function useActions(): Actions {
  return useStoreInstance().actions
}

export function useStoreSnapshot(): () => AppState {
  return useStoreInstance().getState
}
