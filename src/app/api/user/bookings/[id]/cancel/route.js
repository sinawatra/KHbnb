import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensures dynamic cookie handling

export async function POST(request, { params }) {
<<<<<<< HEAD
  const { id: bookingId } = await params;
=======
  const { id: bookingId } = params; // Get the booking ID from the URL
  const supabase = createRouteHandlerClient({ cookies });
>>>>>>> bd7b0b84d151641fb1ccdc896e7223c6c7fd4c18

  const cookieStore = await cookies();
  let supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  let user = null;

  // 2. AUTH CHECK (Hybrid: Try Cookies first, then Bearer Token)
  const {
    data: { session: cookieSession },
  } = await supabase.auth.getSession();

  if (cookieSession) {
    // A. Browser/Frontend Request (Cookies)
    user = cookieSession.user;
  } else {
    // B. Postman/cURL Request (Bearer Token)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Create a temp client just to verify the token
      const supabaseGeneric = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: authHeader } } }
      );

      const {
        data: { user: tokenUser },
      } = await supabaseGeneric.auth.getUser();
      if (tokenUser) {
        user = tokenUser;
        supabase = supabaseGeneric; // Switch to the token-authenticated client
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // 2. Fetch the booking to ensure the user owns it
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // 3. SECURITY CHECK: Ensure the person cancelling is the one who made the booking
  if (booking.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden. You do not own this booking.' }, { status: 403 });
  }
  
  // 4. Update the booking status to 'cancelled'
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // TODO: Add logic here to trigger a refund with Stripe if the status was 'confirmed'

  return NextResponse.json({ message: 'Booking successfully cancelled.' });
}
