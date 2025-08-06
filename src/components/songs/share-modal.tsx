"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { shareApi } from '@/lib/api'
import { Song } from '@/types/music'
import { 
  Copy, 
  Share2, 
  Check, 
  ExternalLink, 
  Calendar,
  Globe,
  Lock,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareModalProps {
  song: Song
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ song, isOpen, onClose }: ShareModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateShare = async () => {
    try {
      setIsCreating(true)
      setError(null)

      const result = await shareApi.create({
        songId: song.id,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        isPublic,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      })

      setShareUrl(result.shareUrl)
    } catch (err: unknown) {
      console.error('Error creating share:', err)
      setError('Failed to create share link. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || song.title,
          text: `Check out &ldquo;${song.title}&rdquo; by ${song.artist}`,
          url: shareUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setIsPublic(true)
    setExpiresAt('')
    setShareUrl('')
    setError(null)
    setIsCopied(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share &quot;{song.title}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!shareUrl ? (
            // Create Share Form
            <>
              {/* Song Preview */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded object-cover overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.image_data || song.thumbnail || "/placeholder.svg"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{song.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="share-title">Custom Title (Optional)</Label>
                  <Input
                    id="share-title"
                    placeholder="Add a custom title for your share"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Give your share a personalized title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-description">Message (Optional)</Label>
                  <Textarea
                    id="share-description"
                    placeholder="Add a message about why you're sharing this song..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={300}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/300 characters
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {isPublic ? (
                        <>
                          <Globe className="w-4 h-4" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Private
                        </>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublic 
                        ? "Anyone with the link can view" 
                        : "Only you can view this share"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires-at" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expiry Date (Optional)
                  </Label>
                  <Input
                    id="expires-at"
                    type="date"
                    min={getMinDate()}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for permanent link
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateShare}
                  disabled={isCreating}
                  className="min-w-[100px]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Create Share
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            // Share URL Generated
            <>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Share Link Created!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your song is ready to be shared
                  </p>
                </div>
              </div>

              {/* Share Settings Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {title && (
                  <div>
                    <h4 className="font-medium">{title}</h4>
                  </div>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isPublic ? "default" : "secondary"} className="text-xs">
                    {isPublic ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </>
                    )}
                  </Badge>
                  {expiresAt && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      Expires {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Unknown'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Share URL */}
              <div className="space-y-3">
                <Label>Share URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                    className={cn(
                      "flex-shrink-0",
                      isCopied && "text-green-600 border-green-600"
                    )}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {isCopied && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Copied to clipboard!
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => window.open(shareUrl, '_blank')}
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <div className="space-x-2">
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      variant="outline"
                      onClick={shareNative}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                  <Button onClick={handleClose}>
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}