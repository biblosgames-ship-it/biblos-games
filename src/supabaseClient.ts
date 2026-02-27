import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lislzcrvahgvjeovkbfc.supabase.co'
const supabaseKey = 'sb_publishable_ewJ4_qXDoGsg_8LuMAbzow_jH3N4l2J'

export const supabase = createClient(supabaseUrl, supabaseKey)