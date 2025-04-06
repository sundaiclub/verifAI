import { useAuth, SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return null;
  }

  return (
    <SignInButton mode="modal">
      <Button>Sign In</Button>
    </SignInButton>
  );
}
