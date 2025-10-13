import Link from "next/link";
import { User } from "lucide-react";

export default function TopNavBar() {
  const isLoggedIn = false;

  return (
    <header className="w-full">
      <nav className="flex items-center justify-between p-4 bg-white">
        <div>
          <Link href="/" className="text-2xl font-bold text-primary">
            KHbnb
          </Link>
        </div>

        <div className="flex gap-20 items-center">
          <Link
            href="/"
            className="flex items-center space-x-2 font-medium text-gray-600 hover:text-black"
          >
            Find property
          </Link>
          <Link
            href="/profile"
            className="flex items-center space-x-2 font-medium text-gray-600 hover:text-black"
          >
            <button
              aria-label="Account"
              className="rounded-xs shadow-sm p-2 hover:cursor-pointer hover:bg-gray-100"
            >
              <User className="h-5 w-5 text-gray-600" />
            </button>
          </Link>

          {isLoggedIn ? (
            <div>
              <p>Logged In</p>
            </div>
          ) : (
            <Link
              href="/register"
              className="rounded-4xl bg-primary px-10 py-3 text-sm font-semibold text-white hover:shadow-lg"
            >
              SIGN UP / LOGIN
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
