import { LoginButton } from "@/components/auth/LoginButton";
import { UserButton, useAuth } from "@clerk/clerk-react";

export function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 flex">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold">verifAI</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2">
          <nav className="flex items-center space-x-4">
            {/* Add navigation items here if needed */}
          </nav>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
