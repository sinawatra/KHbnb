import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBookingReceipt(email, bookingDetails, totalAmount) {
  if (!email) return;

  try {
    const { property, check_in_date, check_out_date, num_guests } =
      bookingDetails;

    // --- 1. Calculate Nights & Fees ---
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const diffTime = Math.abs(checkOut - checkIn);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const pricePerNight = Number(property.price_per_night) || 0;
    const subtotal = nights * pricePerNight;
    const cleaningFee = 20;
    const serviceFee = Math.round(subtotal * 0.1);
    // Formatting Dates
    const formatDate = (d) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

    const checkInStr = formatDate(checkIn);
    const checkOutStr = formatDate(checkOut);
    const hostName = property.host_name || "Unknown Host";
    const locationName = property.provinces?.name || "Cambodia";
    const baseUrl = "https://khbnb-gamma.vercel.app";

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <tr>
                  <td style="padding: 40px;">

                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="width: 60px; height: 60px; background-color: #d1fae5; border-radius: 50%; margin: 0 auto 20px; line-height: 60px;">
                        <span style="font-size: 30px; color: #059669;">✓</span>
                      </div>
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Booking Confirmed!</h1>
                      <p style="margin: 8px 0 0; color: #6b7280;">Receipt for your trip to ${locationName || "Unknown"}</p>
                    </div>

                    <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                      
                      <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px;">
                        Booking Details
                      </h2>

                      <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${property.title}</h3>
                        <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Hosted by ${hostName}</p>
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td width="50%" style="padding-bottom: 15px; vertical-align: top;">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Check-in</p>
                            <p style="margin: 4px 0 0; font-weight: 600; color: #111827;">${checkInStr}</p>
                          </td>
                          <td width="50%" style="padding-bottom: 15px; vertical-align: top;">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Check-out</p>
                            <p style="margin: 4px 0 0; font-weight: 600; color: #111827;">${checkOutStr}</p>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="vertical-align: top;">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Guests</p>
                            <p style="margin: 4px 0 0; font-weight: 600; color: #111827;">${num_guests} guest${num_guests > 1 ? "s" : ""}</p>
                          </td>
                          <td width="50%" style="vertical-align: top;">
                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.5px;">Nights</p>
                            <p style="margin: 4px 0 0; font-weight: 600; color: #111827;">${nights} night${nights > 1 ? "s" : ""}</p>
                          </td>
                        </tr>
                      </table>

                      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 10px;">
                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; margin-bottom: 12px;">
                          <tr>
                            <td style="color: #4b5563; padding-bottom: 8px;">$${pricePerNight} x ${nights} nights</td>
                            <td style="text-align: right; color: #111827; padding-bottom: 8px;">$${subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; padding-bottom: 8px;">Cleaning fee</td>
                            <td style="text-align: right; color: #111827; padding-bottom: 8px;">$${cleaningFee}</td>
                          </tr>
                          <tr>
                            <td style="color: #4b5563; padding-bottom: 8px;">Service fee</td>
                            <td style="text-align: right; color: #111827; padding-bottom: 8px;">$${serviceFee}</td>
                          </tr>
                        </table>

                        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 5px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size: 16px; font-weight: 700; color: #111827;">Total paid</td>
                              <td style="text-align: right; font-size: 18px; font-weight: 700; color: #059669;">$${totalAmount}</td>
                            </tr>
                          </table>
                        </div>

                      </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${baseUrl}/booking-history" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View My Bookings</a>
                      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                        <a href="${baseUrl}" style="color: #6b7280; text-decoration: underline;">Return Home</a>
                      </p>
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"KHbnb" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Booking Confirmed: ${property.title}`,
      html: htmlTemplate,
    });

    console.log(`[EMAIL] Receipt sent to ${email} via Gmail`);
  } catch (error) {
    console.error("[EMAIL] Failed to send receipt:", error);
  }
}
