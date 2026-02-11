import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background overflow-hidden">
      <div className="w-full min-w-[600px] max-w-md p-8 text-center bg-background overflow-y-auto hide-scrollbar max-h-screen">
        <h1 className="text-primary font-bold text-4xl pb-5">KHbnb</h1>
        <h3 className="text-black text-2xl font-bold pb-5">Welcome to KHbnb</h3>
        <p className="pb-5">Secure your booking with an account</p>

        <div className="min-h-[500px]">
          <AuthForm />
          <Link href="/" className="text-m text-muted-foreground mt-6">
           Back to home
        </Link>
        </div>
      </div>
    </main>
  );
}
