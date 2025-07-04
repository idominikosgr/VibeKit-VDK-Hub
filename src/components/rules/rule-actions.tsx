"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Rule } from "@/lib/types"
import { AddToCollectionDialog } from "@/components/collections/add-to-collection-dialog"

interface RuleActionsProps {
  rule: Rule;
  onDownload?: () => Promise<void>;
}

export function RuleActions({ rule, onDownload }: RuleActionsProps) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(rule?.votes || 0)

  // Check if the current user has voted for this rule
  useEffect(() => {
    if (!rule || !rule.id) {
      return;
    }

    async function checkVoteStatus() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return
      }

      const { data } = await supabase
        .from('user_votes')
        .select('id')
        .eq('rule_id', rule.id)
        .eq('user_id', session.user.id)
        .maybeSingle()

      setHasVoted(!!data)
    }

    checkVoteStatus()
  }, [rule?.id, supabase])

  if (!rule || !rule.id) {
    console.error('Rule is invalid:', rule);
    return null;
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      
      // Create a blob from the rule content
      const blob = new Blob([rule.content], { type: 'text/markdown' })

      // Create a temporary link element
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)

      // Set the filename from the rule path
      const filename = rule.path.split('/').pop() || `${rule.id}.mdc`
      link.download = filename

      // Trigger the download
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // Increment download count in database
      try {
        await supabase.rpc('increment_rule_downloads', { target_rule_id: rule.id })
        console.log('Download count incremented for rule:', rule.id)
      } catch (dbError) {
        console.error('Failed to increment download count:', dbError)
        // Don't fail the download if DB update fails
      }

      // Call the server action to record download if provided
      if (onDownload) {
        await onDownload()
      }

      toast.success(`Downloaded ${filename}`)
      
      // Refresh to show updated download count
      router.refresh()
    } catch (error) {
      console.error('Error downloading rule:', error)
      toast.error('Failed to download rule')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleVote = async () => {
    try {
      setIsVoting(true)

      // Check if user is logged in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        toast.error("Authentication error")
        return
      }

      if (!session?.user) {
        toast("Please sign in to vote", {
          action: {
            label: "Sign in",
            onClick: () => router.push("/auth/login")
          }
        })
        return
      }

      console.log("Voting for rule:", rule.id, "User:", session.user.id)

      if (hasVoted) {
        // Remove vote
        console.log("Removing vote...")
        const { error } = await supabase.rpc('remove_rule_vote', { target_rule_id: rule.id })
        
        if (error) {
          console.error("Remove vote error:", error)
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          })
          toast.error(`Failed to remove vote: ${error.message || error.code || 'Unknown error'}`)
          return
        }
        
        setHasVoted(false)
        setVoteCount(count => Math.max(0, count - 1))
        toast.success("Vote removed")
      } else {
        // Add vote
        console.log("Adding vote...")
        const { error } = await supabase.rpc('vote_for_rule', { target_rule_id: rule.id })
        
        if (error) {
          console.error("Add vote error:", error)
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details
          })
          toast.error(`Failed to add vote: ${error.message || error.code || 'Unknown error'}`)
          return
        }
        
        setHasVoted(true)
        setVoteCount(count => count + 1)
        toast.success("Vote added")
      }

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error voting:", error)
      toast.error("Failed to register vote")
    } finally {
      setIsVoting(false)
    }
  }

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(rule.path)
      toast.success('Path copied to clipboard')
    } catch (error) {
      console.error('Error copying path:', error)
      toast.error('Failed to copy path')
    }
  }

  return (
    <div className="flex w-full gap-2">
      <Button
        className="flex-1"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Icons.download className="mr-2 h-4 w-4" />
            Download
          </>
        )}
      </Button>
      <Button
        variant={hasVoted ? "default" : "outline"}
        size="icon"
        onClick={handleVote}
        disabled={isVoting}
        title={hasVoted ? "Remove vote" : "Vote for this rule"}
      >
        {isVoting ? (
          <Icons.loader className="h-4 w-4 animate-spin" />
        ) : (
          <Icons.thumbsUp className={`h-4 w-4 ${hasVoted ? 'text-primary-foreground' : ''}`} />
        )}
      </Button>
      <AddToCollectionDialog
        rule={rule}
        trigger={
          <Button
            variant="outline"
            size="icon"
            title="Add to collection"
          >
            <Icons.userPlus className="h-4 w-4" />
          </Button>
        }
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyPath}
        title="Copy path"
      >
        <Icons.copy className="h-4 w-4" />
      </Button>
    </div>
  )
}
