'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { StorageService } from '@/lib/supabase/storage'

interface AvatarUploadProps {
  currentAvatar?: string
  onAvatarChange?: (url: string) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AvatarUpload({ 
  currentAvatar, 
  onAvatarChange, 
  size = 'lg',
  className = ''
}: AvatarUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('L\'image ne doit pas dépasser 5MB')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setError(null)

    // Upload
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    if (!user) return

    setUploading(true)
    try {
      const result = await StorageService.uploadAvatar(user.id, file)
      
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setPreview(result.url)
        onAvatarChange?.(result.url)
        setError(null)
      }
    } catch (err) {
      setError('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const avatarUrl = preview || currentAvatar
  const initials = user?.firstName 
    ? user.firstName.charAt(0).toUpperCase() + (user.email?.charAt(0).toUpperCase() || '')
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-4 border-white/20`}>
          <AvatarImage src={avatarUrl} alt="Avatar" />
          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Bouton d'upload */}
        <Button
          onClick={triggerFileInput}
          disabled={uploading}
          className="absolute inset-0 w-full h-full rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          variant="ghost"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Label htmlFor="avatar-upload" className="text-sm font-medium">
          Photo de profil
        </Label>
        
        <Button
          onClick={triggerFileInput}
          disabled={uploading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Choisir une photo
            </>
          )}
        </Button>

        <Input
          ref={fileInputRef}
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <p className="text-xs text-gray-500 text-center">
          JPG, PNG ou GIF • Max 5MB
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
