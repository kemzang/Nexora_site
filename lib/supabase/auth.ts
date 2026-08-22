import { supabase } from './client'
import type { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  AuthUser,
  PasswordResetRequest,
  PasswordResetConfirm
} from '@/types'

export class AuthService {
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return {
          user: null,
          session: null,
          error: error.message
        }
      }

      // L'utilisateur est créé directement dans auth.users
      // Pas besoin de mettre à jour une table séparée

      return {
        user: data.user ? this.mapAuthUser(data.user) : null,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at!,
          user: this.mapAuthUser(data.user)
        } : null
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
          }
        }
      })

      if (error) {
        return {
          user: null,
          session: null,
          error: error.message
        }
      }

      return {
        user: data.user ? this.mapAuthUser(data.user) : null,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at!,
          user: this.mapAuthUser(data.user)
        } : null
      }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * getUser() interroge le serveur sous verrou et peut ne jamais rendre la main :
   * ni le catch ni un finally ne s'executent alors, et tout appelant qui
   * l'attend reste bloque — c'est ce qui laissait l'en-tete du site sans bouton
   * de connexion et la page d'authentification en chargement perpetuel.
   *
   * La session locale porte deja l'utilisateur : on la lit d'abord, sans reseau.
   * getUser() ne sert plus que de repli, borne dans le temps.
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        return this.mapAuthUser(session.user)
      }

      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000),
      )
      const lookup = supabase.auth
        .getUser()
        .then(({ data }) => data?.user ?? null)
        .catch(() => null)

      const user = await Promise.race([lookup, timeout])
      return user ? this.mapAuthUser(user) : null
    } catch (error) {
      return null
    }
  }

  static async resetPassword(request: PasswordResetRequest): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email)
      return { error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: confirm.password
      })
      return { error: error?.message }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  
  private static mapAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.first_name || null,
      lastName: user.user_metadata?.last_name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      emailVerified: user.email_confirmed_at !== null,
      isActive: true,
      createdAt: user.created_at,
      lastLogin: user.last_sign_in_at || null
    }
  }
}
