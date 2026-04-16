"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CompleteStepProps {
  onComplete: () => void
  className?: string
}

export function CompleteStep({ onComplete, className }: CompleteStepProps) {
  return (
    <div className={cn("space-y-6 text-center", className)}>
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900">
            All Set!
          </h2>
          <p className="text-zinc-600 max-w-sm mx-auto">
            Your profile is ready. You can now start using NugAI to enhance your academic journey.
          </p>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-xl p-6 text-left space-y-3">
        <h3 className="font-medium text-zinc-900 text-center">What is next?</h3>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-zinc-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Explore your personalized dashboard
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-zinc-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Upload documents for AI analysis
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-zinc-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Ask questions and get instant answers
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-zinc-900 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Manage your courses and track progress
          </li>
        </ul>
      </div>

      <Button onClick={onComplete} className="w-full">
        Go to Dashboard
      </Button>
    </div>
  )
}
