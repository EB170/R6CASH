import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"

export type UserRole = 'admin' | 'client' | null

export const useUserRole = (userId?: string) => {
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setRole(null)
      setLoading(false)
      return
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          setRole('client') // Default to client if error
        } else {
          setRole(data?.role || 'client')
        }
      } catch (error) {
        console.error('Error in useUserRole:', error)
        setRole('client')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [userId])

  return { role, loading, isAdmin: role === 'admin', isClient: role === 'client' }
}