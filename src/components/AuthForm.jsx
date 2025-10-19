"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupFullName, setSignupFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const result = await login(loginEmail, loginPassword);

    if (result.success) {
      router.push("/");
    } else {
      setLoginError(result.error || "Invalid login credentials");
    }

    setLoginLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    const result = await signup(
      signupEmail,
      signupPassword,
      signupFullName,
      signupPhone
    );

    if (result.success) {
      router.push("/");
    } else {
      setSignupError(result.error || "Failed to create account");
    }

    setSignupLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mb-5 p-6 bg-white rounded shadow">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2 mb-5">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <Card>
              <CardContent className="grid gap-6 px-0">
                <div className="grid gap-3">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={loginError ? "border-red-500" : ""}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={loginError ? "border-red-500 pr-10" : "pr-10"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <p className="text-sm text-red-500">{loginError}</p>
                )}
              </CardContent>
              <CardFooter className="px-0">
                <Button
                  className="w-full"
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignup}>
            <Card>
              <CardContent className="grid gap-6 px-0">
                <div className="grid gap-3">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className={signupError ? "border-red-500" : ""}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className={signupError ? "border-red-500" : ""}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className={signupError ? "border-red-500 pr-10" : "pr-10"}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="signup-phone">Phone number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className={signupError ? "border-red-500" : ""}
                    required
                  />
                </div>
                {signupError && (
                  <p className="text-sm text-red-500">{signupError}</p>
                )}
              </CardContent>
              <CardFooter className="px-0">
                <Button
                  className="w-full"
                  type="submit"
                  disabled={signupLoading}
                >
                  {signupLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
