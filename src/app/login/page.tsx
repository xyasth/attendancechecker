import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800">
          AttendanceChecker
        </h1>
        <p className="mt-2 text-center text-gray-500">
          Sign in to continue
        </p>

        {/* Sign in form */}
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
          className="mt-6"
        >
          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
              fill="currentColor"
            >
              <path d="M488 261.8c0-17.8-1.5-35-4.4-51.8H249v98.1h135.5c-5.8 31-23.3 57.1-49.6 74.5v61h80.3c47-43.3 72.8-107.1 72.8-181.8z" fill="#4285F4" />
              <path d="M249 492c66.1 0 121.5-21.9 162-59.4l-80.3-61c-22.3 15-51 23.8-81.7 23.8-62.9 0-116.3-42.5-135.4-99.6h-84v62.3C91.2 443.6 164.1 492 249 492z" fill="#34A853" />
              <path d="M113.6 295c-4.6-13.7-7.2-28.3-7.2-43s2.6-29.3 7.2-43v-62.3h-84C11.7 179.1 0 212.1 0 249s11.7 69.9 29.6 96.3l84-62.3z" fill="#FBBC05" />
              <path d="M249 97c35.9 0 68.2 12.4 93.6 36.6l70.2-70.2C370.5 24.2 315.1 0 249 0 164.1 0 91.2 48.4 45.6 123.7l84 62.3C132.7 139.5 186.1 97 249 97z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
