import type { Question } from '../types/game'

export function checkAnswer(question: Question, userInput: string): boolean {
  const trimmed = userInput.trim()
  if (trimmed === '') return false
  const parsed = parseInt(trimmed, 10)
  if (isNaN(parsed)) return false
  return parsed === question.answer
}
