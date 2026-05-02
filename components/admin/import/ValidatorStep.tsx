"use client"

// Full implementation in commit 3+4
import { FileSpreadsheet } from "lucide-react"
import type { ValidationSummary } from "@/types/import"

interface ValidatorStepProps {
  onValidated: (summary: ValidationSummary) => void
  validationResult: ValidationSummary | null
}

export default function ValidatorStep({ onValidated: _onValidated, validationResult: _validationResult }: ValidatorStepProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 flex flex-col items-center justify-center gap-3 min-h-[300px] text-center">
      <FileSpreadsheet size={40} className="text-stone-300" />
      <p className="font-semibold text-carbon-900">Validador de Excel</p>
      <p className="text-sm text-stone-400 max-w-sm">
        Implementación en progreso. Arrastra tu Excel aquí para validarlo.
      </p>
    </div>
  )
}
