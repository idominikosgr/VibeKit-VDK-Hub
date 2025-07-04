"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardStepProps } from './types'

export function ProjectInfoStep({
  data,
  onNext,
  onUpdateData,
  isFirstStep = true,
  currentStep,
  totalSteps
}: WizardStepProps) {
  const [projectName, setProjectName] = useState(data.projectInfo.name)
  const [projectDescription, setProjectDescription] = useState(data.projectInfo.description || '')

  const handleNext = () => {
    onUpdateData({
      projectInfo: {
        name: projectName,
        description: projectDescription
      }
    })
    onNext()
  }

  const isValid = projectName.trim().length >= 2

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Project Information</h2>
        <p className="text-muted-foreground">
          Tell us about your project to get personalized rule recommendations
        </p>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Provide basic information about your project to help us tailor the rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-project"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              This will be used to generate personalized configuration files
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe what your project does..."
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Optional: Help us understand your project&apos;s purpose for better rule selection
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isFirstStep ? 'Ready to get started?' : ''}
        </div>
        <Button 
          onClick={handleNext} 
          disabled={!isValid}
          size="lg"
          className="min-w-[120px] relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 backdrop-blur-sm border border-primary/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 group"
          style={{
            boxShadow: `
              0 8px 16px rgba(139, 92, 246, 0.25),
              0 0 0 1px rgba(139, 92, 246, 0.1),
              inset 0 1px 2px rgba(255, 255, 255, 0.2)
            `
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative drop-shadow-sm">Next: Choose Stack</span>
        </Button>
      </div>
    </div>
  )
} 