import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message 
      }, { status: 401 });
    }

    // Test if RPC function exists
    const { data, error } = await supabase.rpc('get_comment_thread', {
      poll_uuid: '00000000-0000-0000-0000-000000000000', // dummy UUID
      limit_count: 1,
      offset_count: 0,
    });

    if (error) {
      return NextResponse.json({ 
        error: 'RPC function error', 
        details: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RPC function is available',
      data: data 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
