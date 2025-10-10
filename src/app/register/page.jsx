import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full min-w-[600px] max-w-md p-8 text-center bg-background">
        <h1 className="text-primary font-bold text-4xl pb-5">KHbnb</h1>
        <h3 className="text-black text-2xl font-bold pb-5">Welcome to KHbnb</h3>
        <p className="pb-5">Sign up to create account</p>

        <div className="min-h-[500px]">
          <AuthForm />
          <Link href="/" className="text-m text-muted-foreground mt-6">
          &lt;&nbsp; Back to home
        </Link>
        </div>
      </div>
    </main>
  );
}
