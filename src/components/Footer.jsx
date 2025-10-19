export default function Footer() {
  return (
    <footer className="mt-10 border-t">
      <div className="p-10 text-center text-black bg-white flex">
        <div className="mx-auto text-left">
          <h1 className="text-primary font-bold text-xl mb-4">KHbnb</h1>
          <p className="text-gray-500 font-semibold">
            Your trusted partner for property rentals in Cambodia
          </p>
        </div>
        <div className="mx-auto text-left">
          <h2 className="font-bold">Province</h2>
          <p>Siem Reap</p>
          <p>Kep</p>
          <p>Kampot</p>
          <p>Sihanouk Ville</p>
          <p>Phnom Penh</p>
        </div>
      </div>
      <div className="p-10 text-center text-black border-t">
        &copy; 2025 KHbnb. All rights reserved.
      </div>
    </footer>
  );
}
