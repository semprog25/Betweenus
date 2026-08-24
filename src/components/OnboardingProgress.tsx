interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  label?: string
}

export function OnboardingProgress({ currentStep, totalSteps, label }: OnboardingProgressProps) {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div
      className="fixed top-0 left-0 right-0 z-20 px-6 pt-[max(var(--safe-area-inset-top),12px)] pb-3 bg-[#0f0f1e]/80 backdrop-blur-md"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Onboarding progress'}
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>{label}</span>
          <span>{currentStep + 1} / {totalSteps}</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
