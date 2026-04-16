"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { WelcomeStep } from "./WelcomeStep"
import { ProfileStep, type ProfileData } from "./ProfileStep"
import { CourseStep, type CourseData } from "./CourseStep"
import { CompleteStep } from "./CompleteStep"
import { cn } from "@/lib/utils"

type Step = "welcome" | "profile" | "course" | "complete"

interface OnboardingData {
  profile: ProfileData | null
  course: CourseData | null
}

interface OnboardingWizardProps {
  className?: string
}

export function OnboardingWizard({ className }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    profile: null,
    course: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps: { id: Step; label: string }[] = [
    { id: "welcome", label: "Welcome" },
    { id: "profile", label: "Profile" },
    { id: "course", label: "Course" },
    { id: "complete", label: "Complete" },
  ]

  const getCurrentStepIndex = () => steps.findIndex((s) => s.id === currentStep)

  const handleWelcomeNext = () => {
    setCurrentStep("profile")
  }

  const handleProfileNext = (data: ProfileData) => {
    setOnboardingData((prev) => ({ ...prev, profile: data }))
    setCurrentStep("course")
  }

  const handleProfileBack = () => {
    setCurrentStep("welcome")
  }

  const handleCourseNext = (data: CourseData | null) => {
    setOnboardingData((prev) => ({ ...prev, course: data }))
    setCurrentStep("complete")
  }

  const handleCourseBack = () => {
    setCurrentStep("profile")
  }

  const handleComplete = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: onboardingData.profile,
          course: onboardingData.course,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to save onboarding data")
      }

      toast.success("Onboarding completed successfully")
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error("Failed to complete onboarding", {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep onNext={handleWelcomeNext} />
      case "profile":
        return (
          <ProfileStep
            onNext={handleProfileNext}
            onBack={handleProfileBack}
            initialData={onboardingData.profile}
          />
        )
      case "course":
        return (
          <CourseStep
            onNext={handleCourseNext}
            onBack={handleCourseBack}
            initialData={onboardingData.course}
          />
        )
      case "complete":
        return (
          <CompleteStep
            onComplete={handleComplete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < getCurrentStepIndex()
            const isUpcoming = index > getCurrentStepIndex()

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isActive && "bg-zinc-900 text-white",
                    isCompleted && "bg-zinc-900 text-white",
                    isUpcoming && "bg-zinc-200 text-zinc-500"
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 hidden sm:block",
                    isActive && "text-zinc-900 font-medium",
                    isCompleted && "text-zinc-900",
                    isUpcoming && "text-zinc-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="relative h-1 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-zinc-900 transition-all duration-300 ease-out"
            style={{
              width: `${((getCurrentStepIndex() + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-zinc-600">
              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          </div>
        )}
        {renderStep()}
      </div>
    </div>
  )
}
