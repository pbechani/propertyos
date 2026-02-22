import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Home, Chrome, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

export default function OAuthConnect() {
  const navigate = useNavigate();
  const [selectedProvider] = useState("google");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth flow
    setTimeout(() => {
      navigate("/email-verification");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Home className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl">PropertyOS</span>
        </Link>

        <Card className="p-8 border-gray-200">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Connect Your Account</h1>
            <p className="text-gray-600">Continue with your preferred provider</p>
          </div>

          {isConnecting ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Connecting to {selectedProvider}...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card
                className="p-6 border-2 border-gray-200 hover:border-black cursor-pointer transition-colors"
                onClick={handleConnect}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Chrome className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <div className="font-semibold">Continue with Google</div>
                      <div className="text-sm text-gray-600">
                        Use your Google account
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>

              <Card
                className="p-6 border-2 border-gray-200 hover:border-black cursor-pointer transition-colors"
                onClick={handleConnect}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
                        <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z" />
                        <path fill="#7fba00" d="M0 12.628h11.377V24H0z" />
                        <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Continue with Microsoft</div>
                      <div className="text-sm text-gray-600">
                        Use your Microsoft account
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-gray-300"
                onClick={() => navigate("/register")}
              >
                Continue with Email
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-black font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 leading-relaxed">
              By continuing, you agree to PropertyOS's{" "}
              <Link to="#" className="text-black hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-black hover:underline">
                Privacy Policy
              </Link>
              . We'll never post without your permission.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}