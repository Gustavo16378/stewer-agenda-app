/**
 * Um mes inteiro em grade (domingo a sabado), com quantos atendimentos tem em cada dia.
 * Serve de visao do mes na agenda e de seletor de data: tocar num dia abre o dia.
 */
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import {
  diaDoMes,
  gradeDoMes,
  hojeCalendarDate,
  parseCalendarDate,
  type CalendarDate,
} from '@/lib/datetime';

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function CalendarioMes({
  referencia,
  contagem,
  selecionado,
  aoEscolher,
  compacto = false,
}: {
  /** qualquer dia do mes a mostrar */
  referencia: CalendarDate;
  /** atendimentos por dia (so os que contam: marcados e atendidos) */
  contagem?: ReadonlyMap<CalendarDate, number>;
  selecionado?: CalendarDate;
  aoEscolher: (dia: CalendarDate) => void;
  compacto?: boolean;
}) {
  const d = parseCalendarDate(referencia) ?? new Date();
  const celulas = gradeDoMes(d.getFullYear(), d.getMonth());
  const hoje = hojeCalendarDate();
  const maximo = Math.max(1, ...[...(contagem?.values() ?? [])]);

  return (
    <View>
      <View className="flex-row">
        {LETRAS.map((l, i) => (
          <Text
            key={i}
            className="flex-1 pb-2 text-center font-sans-semibold text-ui-xs text-texto-3"
          >
            {l}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {celulas.map((dia, i) => {
          if (!dia) return <View key={`v${i}`} style={{ width: `${100 / 7}%` }} />;
          const n = contagem?.get(dia) ?? 0;
          const ehHoje = dia === hoje;
          const ativo = dia === selecionado;
          const rotulo = `${parseCalendarDate(dia)?.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}${contagem ? `, ${n} ${n === 1 ? 'atendimento' : 'atendimentos'}` : ''}`;
          return (
            <View key={dia} style={{ width: `${100 / 7}%` }} className="p-[2px]">
              <Pressable
                onPress={() => aoEscolher(dia)}
                accessibilityRole="button"
                accessibilityLabel={rotulo}
                accessibilityState={{ selected: ativo }}
                className={cn(
                  'items-center rounded-[3px] border',
                  compacto ? 'py-2' : 'py-3',
                  ativo ? 'border-latao bg-latao' : ehHoje ? 'border-latao' : 'border-transparent',
                  !ativo && n > 0 && !compacto && 'bg-superficie'
                )}
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
              >
                <Text
                  className={cn(
                    'font-sans-semibold text-ui',
                    ativo ? 'text-fundo' : ehHoje ? 'text-latao' : 'text-texto'
                  )}
                >
                  {diaDoMes(dia)}
                </Text>
                {contagem ? (
                  n > 0 ? (
                    <View className="mt-1 flex-row items-center gap-[2px]">
                      {/* ate quatro pontos, proporcionais ao dia mais cheio do mes */}
                      {Array.from({ length: Math.max(1, Math.round((n / maximo) * 4)) }).map(
                        (_, k) => (
                          <View
                            key={k}
                            className={cn(
                              'h-[5px] w-[5px] rounded-full',
                              ativo ? 'bg-fundo' : 'bg-latao'
                            )}
                          />
                        )
                      )}
                      {compacto ? null : (
                        <Text
                          className={cn(
                            'ml-1 font-sans text-ui-xs',
                            ativo ? 'text-fundo' : 'text-texto-3'
                          )}
                        >
                          {n}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View className="mt-1 h-[5px]" />
                  )
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
