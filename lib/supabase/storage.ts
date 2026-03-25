import { supabase } from './client'
import type { User } from '@supabase/supabase-js'

export class StorageService {
  // Upload un avatar
  static async uploadAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        throw uploadError
      }

      // Rendre l'avatar public
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { url: publicUrlData.publicUrl }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }

  // Supprimer un avatar
  static async deleteAvatar(filePath: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      return { error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }

  // Upload un fichier utilisateur
  static async uploadUserFile(
    userId: string, 
    file: File, 
    folder: string = 'general'
  ): Promise<{ url?: string; path?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        throw uploadError
      }

      // URL signée pour accès privé
      const { data: signedUrlData } = await supabase.storage
        .from('user-files')
        .createSignedUrl(fileName, 3600) // 1 heure

      return { 
        url: signedUrlData?.signedUrl,
        path: fileName
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }

  // Lister les fichiers d'un utilisateur
  static async listUserFiles(
    userId: string, 
    folder: string = 'general'
  ): Promise<{ files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .list(`${folder}/${userId}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      return { files: data || [], error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'List failed' }
    }
  }

  // Obtenir une URL signée pour un fichier
  static async getSignedUrl(
    bucket: string, 
    filePath: string, 
    expiresIn: number = 3600
  ): Promise<{ url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn)

      return { url: data?.signedUrl, error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'URL generation failed' }
    }
  }

  // Supprimer un fichier utilisateur
  static async deleteUserFile(filePath: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from('user-files')
        .remove([filePath])

      return { error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Delete failed' }
    }
  }

  // Upload un document (facture, contrat, etc.)
  static async uploadDocument(
    userId: string, 
    file: File, 
    documentType: string
  ): Promise<{ url?: string; path?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `documents/${userId}/${documentType}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        throw uploadError
      }

      // URL signée pour accès privé
      const { data: signedUrlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 24 * 3600) // 24 heures

      return { 
        url: signedUrlData?.signedUrl,
        path: fileName
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }
}
