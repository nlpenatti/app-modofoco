import { useEffect } from 'react'
import { useToasts } from '../contextos/ContextoToasts'

type Props = {
  aoDetectarDistracao: (indicador?: string, tituloJanela?: string) => void
}

export function GerenciadorEventosGlobais({ aoDetectarDistracao }: Props): null {
  const { mostrarToast } = useToasts()

  useEffect(() => {
    const descadastrarAtividade = window.api.aoAtividadeMonitor((evento) => {
      if (evento.tipo === 'distraction_detected') {
        aoDetectarDistracao(evento.indicador, evento.tituloJanela)
      }
    })

    // Evento de fechamento bloqueado
    const descadastrarFechamento = window.api.aoAvisoFechamentoBloqueado(() => {
      mostrarToast('Você não pode fechar o app enquanto uma sessão de foco está ativa!', 'erro')
    })
    
    return () => {
      descadastrarAtividade()
      descadastrarFechamento()
    }
  }, [aoDetectarDistracao, mostrarToast])

  return null
}
