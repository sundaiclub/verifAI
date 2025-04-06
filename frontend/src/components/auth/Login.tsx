import { SignIn } from "@clerk/clerk-react";

export function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        routing="path" 
        path="/sign-in" 
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  );
}