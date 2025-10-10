import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <Link href="/register" className="text-5xl">Log in/Sign up</Link>
    </main>
  );
}