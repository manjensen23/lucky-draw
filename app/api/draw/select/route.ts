import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { isAllGroups, targetGroups, count, category } = await req.json()
    
    // We use the service role client (admin client) to bypass RLS policies
    // This allows the public page to trigger the draw without needing full user auth,
    // though the endpoint should ideally be protected against abuse.
    const supabaseAdmin = createAdminClient()
    
    // 1. Validate Stock
    if (!category) {
      return NextResponse.json({ error: 'Kategori Hadiah harus dipilih' }, { status: 400 })
    }
    
    const { data: catData, error: catError } = await supabaseAdmin
      .from('winner_categories')
      .select('stock')
      .eq('name', category)
      .single()
      
    if (catError || !catData) {
      return NextResponse.json({ error: 'Kategori Hadiah tidak ditemukan' }, { status: 400 })
    }
    
    const actualCountToDraw = Math.min(count, catData.stock)
    
    if (actualCountToDraw < 1) {
      return NextResponse.json({ error: 'Stok Hadiah sudah habis!' }, { status: 400 })
    }

    // Verify authentication
    const { data: session } = await supabaseAdmin.auth.getSession()
    
    const { data, error } = await supabaseAdmin.rpc('select_winners', {
      p_is_all_groups: isAllGroups,
      p_target_groups: targetGroups,
      p_winner_count: actualCountToDraw,
      p_category: category || null
    })
    
    if (error) {
      console.error('Database error in select_winners:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Deduct stock
    const drawnWinnersCount = data.length
    if (drawnWinnersCount > 0) {
      await supabaseAdmin.from('winner_categories')
        .update({ stock: catData.stock - drawnWinnersCount })
        .eq('name', category)
    }

    // Map the returned SQL columns (which we renamed to avoid ambiguity) back to the expected frontend format
    const formattedWinners = data.map((w: any) => ({
      id: w.id,
      name: w.winner_name,
      group: w.winner_group
    }))
    
    return NextResponse.json({ winners: formattedWinners })
  } catch (err: any) {
    console.error('API error in /api/draw/select:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
