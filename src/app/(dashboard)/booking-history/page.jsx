import BookingCard from "@/components/BookingCard";

const bookings = [
  {
    id: "B001",
    title: "Angkor Temple View Villa",
    status: 'pending',
    image: "#",
    checkIn: "Oct 15, 2025",
    checkOut: "Oct 17, 2025",
    guests: 4,
    price: 195,
  },
  {
    id: "B002",
    title: "Riverside Boutique Hotel",
    status: 'completed',
    image: "#",
    checkIn: "Nov 5, 2025",
    checkOut: "Nov 8, 2025",
    guests: 2,
    price: 320,
  },
  {
    id: "B003",
    title: "Royal Palace Garden Suite",
    status: 'cancelled',
    image: "#",
    checkIn: "Dec 20, 2025",
    checkOut: "Dec 25, 2025",
    guests: 6,
    price: 875,
  },
  {
    id: "B004",
    title: "Central Market Loft",
    status: 'cancelled',
    image: "#",
    checkIn: "Jan 10, 2026",
    checkOut: "Jan 12, 2026",
    guests: 3,
    price: 240,
  },
  {
    id: "B005",
    title: "Tonle Sap Lake House",
    status: 'completed',
    image: "#",
    checkIn: "Feb 14, 2026",
    checkOut: "Feb 18, 2026",
    guests: 5,
    price: 480,
  },
];

export default function Home() {
  return (
    <div className="pl-4">
      <h1 className="font-bold text-2xl">Booking History</h1>
      <p className="text-gray-400 font-semibold">
        View and manage your reservations
      </p>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
