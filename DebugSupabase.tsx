// src/DebugSupabase.tsx
import { useEffect } from 'react'
import { supabase } from './lib/supabase'

export const DebugSupabase = () => {
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('actors')
        .select('*')
        .limit(5)

      console.log('Supabase test / actors data:', data)
      console.log('Supabase test / error:', error)
    })()
  }, [])

  return null
}
