/**
 * knockout-weight.ts
 *
 * Helper único para o sistema de peso por fase no mata-mata da Copa do Mundo.
 *
 * Regras de negócio:
 *  - O peso é opcional (Pool.knockoutWeightEnabled). Desligado → sempre 1×.
 *  - Só fases eliminatórias recebem peso. Fase de Grupos e REGULAR_SEASON → 1×.
 *  - Bolões do Brasileirão têm todas as rodadas como REGULAR_SEASON → nunca peso.
 *  - O multiplicador é aplicado sobre os pontos-base (10/7/5/3/0) de cada palpite.
 */

import type { FDStage } from '@/lib/football-data';

/** Subconjunto do model Pool necessário para calcular o multiplicador. */
export interface PoolWeightConfig {
  knockoutWeightEnabled: boolean;
  weightLast32:  number; // Rodada de 32
  weightLast16:  number; // Oitavas de Final
  weightQuarter: number; // Quartas de Final
  weightSemi:    number; // Semifinais
  weightThird:   number; // Disputa pelo 3º Lugar
  weightFinal:   number; // Final
}

/** Fases eliminatórias que podem receber peso. GROUP_STAGE e REGULAR_SEASON nunca entram aqui. */
const KNOCKOUT_STAGES = new Set<string>([
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
]);

/**
 * Retorna o multiplicador de pontos para um palpite em determinada fase.
 *
 * Retorna 1 (sem efeito) se:
 *  - Pool.knockoutWeightEnabled === false
 *  - stage é null/undefined (rodadas sem stage populado)
 *  - stage é GROUP_STAGE ou REGULAR_SEASON
 *
 * @param pool   Config do bolão com os campos de peso.
 * @param stage  Round.stage da rodada (FDStage ou null).
 */
export function getKnockoutWeight(
  pool: PoolWeightConfig,
  stage: string | null | undefined,
): number {
  if (!pool.knockoutWeightEnabled || !stage || !KNOCKOUT_STAGES.has(stage)) {
    return 1;
  }

  switch (stage as FDStage) {
    case 'LAST_32':        return pool.weightLast32;
    case 'LAST_16':        return pool.weightLast16;
    case 'QUARTER_FINALS': return pool.weightQuarter;
    case 'SEMI_FINALS':    return pool.weightSemi;
    case 'THIRD_PLACE':    return pool.weightThird;
    case 'FINAL':          return pool.weightFinal;
    // GROUP_STAGE, REGULAR_SEASON e qualquer valor desconhecido → sem peso
    default:               return 1;
  }
}

/**
 * Retorna true se o stage é uma fase eliminatória da Copa.
 * Útil para decidir se uma rodada pode ter peso (independente de estar ligado).
 */
export function isKnockoutStage(stage: string | null | undefined): boolean {
  return !!stage && KNOCKOUT_STAGES.has(stage);
}

/**
 * Calcula os pontos finais de um palpite aplicando o multiplicador de fase.
 *
 * @param basePoints Pontos-base do calculateScore (10/7/5/3/0).
 * @param pool       Config do bolão.
 * @param stage      Round.stage da rodada.
 * @returns          { basePoints, points } prontos para salvar na Prediction.
 */
export function applyWeight(
  basePoints: number,
  pool: PoolWeightConfig,
  stage: string | null | undefined,
): { basePoints: number; points: number } {
  const weight = getKnockoutWeight(pool, stage);
  return { basePoints, points: basePoints * weight };
}
