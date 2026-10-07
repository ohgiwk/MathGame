import type { Question } from '../types/game'
import { OPERATOR_SYMBOLS } from './labels'

export function formatQuestion(q: Question): string {
  return `${q.operandA} ${OPERATOR_SYMBOLS[q.operation]} ${q.operandB}`
}

export function formatScore(score: number): string {
  return score.toLocaleString('ja-JP')
}

export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

export function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

export function formatPlayedAt(timestamp: number): string {
  const d = new Date(timestamp)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}
