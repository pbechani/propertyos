import { Link } from "react-router";
import { Sun, Moon, Monitor, Palette, Eye, Settings, CheckCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ThemeToggle, ThemeToggleWithLabel, ThemeToggleDropdown } from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeDocumentation() {
  const { theme } = useTheme();

  const features = [
    {
      icon: Palette,
      title: "System-wide Theme",
      description: "One toggle controls the entire application appearance",
    },
    {
      icon: Settings,
      title: "Persistent Preference",
      description: "Your theme choice is saved in localStorage",
    },
    {
      icon: Monitor,
      title: "System Detection",
      description: "Automatically detects your OS dark mode preference on first visit",
    },
    {
      icon: Eye,
      title: "Optimized for Both",
      description: "All components designed to look great in light and dark modes",
    },
  ];

  const themeVariables = [
    { name: "--background", light: "#ffffff", dark: "oklch(0.145 0 0)" },
    { name: "--foreground", light: "oklch(0.145 0 0)", dark: "oklch(0.985 0 0)" },
    { name: "--card", light: "#ffffff", dark: "oklch(0.145 0 0)" },
    { name: "--primary", light: "#030213", dark: "oklch(0.985 0 0)" },
    { name: "--border", light: "rgba(0, 0, 0, 0.1)", dark: "oklch(0.269 0 0)" },
  ];

  const componentExamples = [
    { name: "Buyer Dashboard", route: "/buyer-dashboard" },
    { name: "Login Screen", route: "/login-enhanced" },
    { name: "Property Listings", route: "/app/listings" },
    { name: "Construction Dashboard", route: "/construction" },
    { name: "AI Design Studio", route: "/ai-design-studio" },
    { name: "Analytics Dashboard", route: "/risk-analytics" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                {theme === "dark" ? (
                  <Moon className="w-7 h-7 text-white" />
                ) : (
                  <Sun className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  Theme System Documentation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete dark & light mode implementation
                </p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                Back to Home
              </Button>
            </Link>
          </div>

          <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✓ Dark & Light Mode Fully Implemented
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  The entire property marketplace platform now supports both dark and light themes
                  with seamless switching and persistent preferences.
                </p>
                <div className="text-xs text-green-700 dark:text-green-300">
                  Current theme: <span className="font-semibold capitalize">{theme} Mode</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Theme Toggle Variants */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Theme Controls</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-4">Icon Toggle</h3>
              <div className="flex items-center justify-center py-4">
                <ThemeToggle />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Compact icon-only toggle for headers and toolbars
              </p>
            </Card>

            <Card className="p-6 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-4">Button with Label</h3>
              <div className="flex items-center justify-center py-4">
                <ThemeToggleWithLabel />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Button format with descriptive label
              </p>
            </Card>

            <Card className="p-6 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-4">Segmented Control</h3>
              <div className="flex items-center justify-center py-4">
                <ThemeToggleDropdown />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Two-option selector for settings pages
              </p>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Key Features</h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-5 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-black dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Theme Variables */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Theme Variables</h2>
          <Card className="p-6 border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              CSS custom properties that adapt based on the selected theme:
            </p>
            <div className="space-y-2">
              {themeVariables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <code className="text-sm font-mono text-purple-600 dark:text-purple-400 flex-shrink-0 w-40">
                    {variable.name}
                  </code>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {variable.light}
                      </code>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {variable.dark}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> All color values are defined in{" "}
              <code className="font-mono">/src/styles/theme.css</code>
            </div>
          </Card>
        </div>

        {/* Implementation Details */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
            Implementation Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3 text-black dark:text-white">Theme Context</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    React Context for global state
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    localStorage persistence
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    System preference detection
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  /src/app/contexts/ThemeContext.tsx
                </code>
              </div>
            </Card>

            <Card className="p-6 border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3 text-black dark:text-white">
                Tailwind Integration
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Tailwind v4 dark mode
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    CSS custom properties
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">Class-based theming</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  /src/styles/theme.css
                </code>
              </div>
            </Card>
          </div>
        </div>

        {/* Component Examples */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
            Theme-Ready Components
          </h2>
          <Card className="p-6 border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              All major components support dark mode. Try switching themes to see them in action:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {componentExamples.map((component, index) => (
                <Link key={index} to={component.route}>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-700"
                  >
                    {component.name}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Usage Example */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-black dark:text-white">Usage Example</h2>
          <Card className="p-6 border-gray-200 dark:border-gray-800 bg-gray-900 dark:bg-gray-950">
            <pre className="text-sm text-green-400 font-mono overflow-x-auto">
              <code>{`import { useTheme } from "../contexts/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-900">
      <h1 className="text-black dark:text-white">
        Current theme: {theme}
      </h1>
      <ThemeToggle />
    </div>
  );
}`}</code>
            </pre>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="p-6 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <h3 className="font-semibold text-lg mb-4 text-black dark:text-white">
            Benefits of Dark Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-black dark:text-white">For Users</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Reduced eye strain in low-light</li>
                <li>• Better battery life (OLED screens)</li>
                <li>• Personal preference accommodation</li>
                <li>• Modern, professional appearance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-black dark:text-white">For Platform</h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Enhanced user experience</li>
                <li>• Accessibility compliance</li>
                <li>• Competitive feature parity</li>
                <li>• User retention improvement</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
