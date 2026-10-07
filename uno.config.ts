import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  safelist: [
    'bg-green-500',
    'bg-red-500',
    'bg-green-50',
    'bg-red-50',
    'text-green-700',
    'text-red-700',
    'text-green-600',
    'text-red-600',
    'border-amber-500',
    'bg-amber-50',
    'text-amber-700',
    'border-stone-200',
    'text-stone-600',
    'text-stone-300',
    'text-red-500',
    'text-red-400',
    'scale-95',
    'opacity-50',
    'shake',
  ],
  shortcuts: {
    'btn-primary': 'bg-amber-500 text-white font-bold rounded-2xl px-6 py-4 active:scale-95 transition-transform duration-100 shadow-lg w-full text-xl',
    'btn-secondary': 'bg-stone-600 text-amber-100 font-bold rounded-xl px-6 py-3 active:scale-95 transition-transform duration-100 w-full text-lg',
    'option-btn': 'rounded-xl px-4 py-2 border-2 font-medium transition-all duration-150 text-center',
    'option-active': 'border-amber-500 bg-amber-50 text-amber-700 font-bold',
    'option-inactive': 'border-stone-200 bg-white text-stone-600',
    'card': 'bg-white rounded-2xl shadow-md p-5',
  },
})
