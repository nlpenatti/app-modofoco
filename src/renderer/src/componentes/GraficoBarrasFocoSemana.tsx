import type React from 'react'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { PontoBarraFocoDia } from '../utilHistoricoPomodoro'

const COR_PRIMARIA = 'hsl(265 50% 68%)'
const COR_PRIMARIA_MUDA = 'hsl(265 50% 68% / 0.3)'

type PontoHoras = PontoBarraFocoDia & { horas: number }

type Props = {
  dados: PontoBarraFocoDia[]
  /** Eixo Y em horas (0,25h …) como na referência visual */
  eixoEmHoras?: boolean
}

export function GraficoBarrasFocoSemana({
  dados,
  eixoEmHoras = false
}: Props): React.JSX.Element {
  const dadosGrafico: PontoHoras[] = useMemo(
    () =>
      dados.map((p) => ({
        ...p,
        horas: Math.round((p.minutos / 60) * 1000) / 1000
      })),
    [dados]
  )

  if (dados.length === 0) {
    return (
      <p className="text-center text-sm text-texto-mudo">
        Sem dados ainda — complete blocos de foco para ver o gráfico.
      </p>
    )
  }

  const chave = eixoEmHoras ? 'horas' : 'minutos'
  const nomeValor = eixoEmHoras ? 'Foco (h)' : 'Foco'

  return (
    <div className="h-52 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dadosGrafico} margin={{ top: 8, right: 4, left: eixoEmHoras ? -8 : -18, bottom: 0 }}>
          <CartesianGrid stroke="hsl(280 20% 87%)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fill: 'hsl(270 12% 52%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(270 12% 52%)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals
            width={eixoEmHoras ? 40 : 36}
            tickFormatter={eixoEmHoras ? (v) => `${v}h` : undefined}
          />
          <Tooltip
            cursor={{ fill: 'hsl(265 50% 68% / 0.08)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid hsl(280 20% 87%)',
              background: 'hsl(38 30% 99%)',
              fontSize: 12,
              color: 'hsl(270 20% 18%)'
            }}
            formatter={(v) =>
              eixoEmHoras
                ? [`${String(v ?? 0)} h`, nomeValor]
                : [`${String(v ?? 0)} min`, nomeValor]
            }
            labelFormatter={(_l, payload) => {
              const pt = payload?.[0]?.payload as PontoBarraFocoDia | undefined
              return pt?.ehHoje ? 'Hoje' : (pt?.rotulo ?? '')
            }}
          />
          <Bar dataKey={chave} radius={[10, 10, 4, 4]} maxBarSize={44}>
            {dadosGrafico.map((p) => (
              <Cell key={p.chaveDia} fill={p.ehHoje ? COR_PRIMARIA : COR_PRIMARIA_MUDA} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
