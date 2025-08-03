"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import {
  Music,
  Camera,
  Sparkles,
  Loader2,
  X
} from "lucide-react"
import { useMusicStore } from "@/lib/store"

interface CreatePlaylistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Predefined gradient options like Spotify
const gradientOptions = [
  "bg-gradient-to-br from-purple-600 to-blue-600",
  "bg-gradient-to-br from-green-600 to-teal-600",
  "bg-gradient-to-br from-red-600 to-pink-600",
  "bg-gradient-to-br from-yellow-600 to-orange-600",
  "bg-gradient-to-br from-indigo-600 to-purple-600",
  "bg-gradient-to-br from-pink-600 to-rose-600",
  "bg-gradient-to-br from-cyan-600 to-blue-600",
  "bg-gradient-to-br from-emerald-600 to-green-600",
]

export function CreatePlaylistModal({ open, onOpenChange }: CreatePlaylistModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [selectedGradient, setSelectedGradient] = useState(gradientOptions[0])
  const [isLoading, setIsLoading] = useState(false)
  const [useGradient, setUseGradient] = useState(true)
  
  const { addPlaylist } = useMusicStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      await addPlaylist({
        name: name.trim(),
        description: description.trim(),
        coverImage: useGradient ? selectedGradient : (coverImage || selectedGradient)
      })
      
      // Reset form
      setName("")
      setDescription("")
      setCoverImage(null)
      setSelectedGradient(gradientOptions[0])
      setUseGradient(true)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create playlist:", error)
      alert("Failed to create playlist. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImage(reader.result as string)
        setUseGradient(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setCoverImage(null)
    setUseGradient(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Playlist</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a name and description for your playlist
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Section */}
          <div className="flex gap-6">
            <div className="relative group">
              <div className={`w-44 h-44 rounded-lg overflow-hidden ${useGradient ? selectedGradient : 'bg-muted'} shadow-xl`}>
                {!useGradient && coverImage ? (
                  <ImageWithFallback
                    src={coverImage}
                    alt="Playlist cover"
                    width={176}
                    height={176}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/80" />
                  </div>
                )}
              </div>
              
              {/* Upload/Edit Button */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Choose photo</span>
                  </div>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {/* Remove Image Button */}
              {!useGradient && coverImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="bg-background"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Give your playlist a catchy description"
                  className="bg-background resize-none"
                  rows={3}
                  maxLength={300}
                />
              </div>
            </div>
          </div>

          {/* Gradient Selection */}
          {useGradient && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Choose a color</Label>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {gradientOptions.map((gradient, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedGradient(gradient)}
                    className={`w-10 h-10 rounded ${gradient} ${
                      selectedGradient === gradient 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}