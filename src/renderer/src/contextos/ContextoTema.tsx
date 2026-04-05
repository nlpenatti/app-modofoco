import React, { createContext, useContext, useEffect, useState } from 'react'

type Tema = 'claro' | 'escuro'

interface ContextoTemaType {
  tema: Tema
  alternarTema: () => void
  setTema: (tema: Tema) => void
}

const ContextoTema = createContext<ContextoTemaType | undefined>(undefined)

export const CHAVE_LOCAL_STORAGE_TEMA = 'modo-foco:tema'

export function ProvedorTema({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [tema, setTemaState] = useState<Tema>(() => {
    const salvo = localStorage.getItem(CHAVE_LOCAL_STORAGE_TEMA)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('claro', 'escuro')
    root.classList.add(tema)
    localStorage.setItem(CHAVE_LOCAL_STORAGE_TEMA, tema)
  }, [tema])

  const alternarTema = (): void => {
    setTemaState((prev) => (prev === 'claro' ? 'escuro' : 'claro'))
  }

  const setTema = (novoTema: Tema): void => {
    setTemaState(novoTema)
  }

  return (
    <ContextoTema.Provider value={{ tema, alternarTema, setTema }}>
      {children}
    </ContextoTema.Provider>
  )
}

export function useTema(): ContextoTemaType {
  const contexto = useContext(ContextoTema)
  if (!contexto) {
    throw new Error('useTema deve ser usado dentro de um ProvedorTema')
  }
  return contexto
}
