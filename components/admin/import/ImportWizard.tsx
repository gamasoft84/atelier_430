"use client"

import { useState } from "react"
import { Check, Lock, Download, FileSpreadsheet, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import TemplateStep from "@/components/admin/import/TemplateStep"
import ValidatorStep from "@/components/admin/import/ValidatorStep"
import type { ValidationSummary } from "@/types/import"

type Step = 0 | 1 | 2

const STEPS = [
  { label: "Descargar plantilla", icon: Download, description: "Plantilla Excel con validaciones" },
  { label: "Subir Excel",         icon: FileSpreadsheet, description: "Valida tus datos antes de importar" },
  { label: "Subir imágenes",      icon: ImageIcon, description: "ZIP con fotos de las obras" },
]

export default function ImportWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(0)
  const [templateDownloaded, setTemplateDownloaded] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null)

  const canAccessStep = (step: Step): boolean => {
    if (step === 0) return true
    if (step === 1) return templateDownloaded
    return false // step 2 locked this session
  }

  return (
    <div className="flex gap-8">
      {/* ─ Vertical stepper ─────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0">
        <ol className="relative space-y-0">
          {STEPS.map((step, idx) => {
            const stepNum = idx as Step
            const isActive = currentStep === stepNum
            const isDone = stepNum === 0
              ? templateDownloaded
              : stepNum === 1
              ? validationResult !== null && validationResult.withErrors === 0
              : false
            const isLocked = stepNum === 2
            const isAccessible = canAccessStep(stepNum)

            return (
              <li key={step.label} className="relative">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-4 top-9 w-px h-8",
                      isDone ? "bg-gold-500" : "bg-stone-200"
                    )}
                  />
                )}

                <button
                  type="button"
                  disabled={!isAccessible || isLocked}
                  onClick={() => isAccessible && !isLocked && setCurrentStep(stepNum)}
                  className={cn(
                    "flex items-start gap-3 w-full text-left py-2 px-1 rounded-lg transition-colors",
                    isActive && "bg-stone-100",
                    isAccessible && !isLocked && !isActive && "hover:bg-stone-50",
                    (!isAccessible || isLocked) && "cursor-default opacity-50"
                  )}
                >
                  {/* Step circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 border-2 transition-colors",
                      isDone
                        ? "bg-gold-500 border-gold-500 text-white"
                        : isActive
                        ? "border-carbon-900 bg-carbon-900 text-white"
                        : isLocked
                        ? "border-stone-200 bg-stone-100 text-stone-300"
                        : "border-stone-200 bg-white text-stone-400"
                    )}
                  >
                    {isDone ? (
                      <Check size={14} />
                    ) : isLocked ? (
                      <Lock size={13} />
                    ) : (
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-0.5 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-tight",
                        isActive ? "text-carbon-900" : isLocked ? "text-stone-300" : "text-stone-500"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className={cn(
                      "text-xs mt-0.5 leading-tight",
                      isLocked ? "text-stone-300" : "text-stone-400"
                    )}>
                      {isLocked ? "Sesión 2 — próximamente" : step.description}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* ─ Step content ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {currentStep === 0 && (
          <TemplateStep
            onDownloaded={() => {
              setTemplateDownloaded(true)
              setTimeout(() => setCurrentStep(1), 600)
            }}
          />
        )}

        {currentStep === 1 && (
          <ValidatorStep
            onValidated={(summary) => setValidationResult(summary)}
            validationResult={validationResult}
          />
        )}
      </div>
    </div>
  )
}
