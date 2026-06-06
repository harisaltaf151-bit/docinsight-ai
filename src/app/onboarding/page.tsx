import type { Metadata } from "next";
import { ConnectFlow } from "@/components/onboarding/connect-flow";

export const metadata: Metadata = {
  title: "Connect your AI provider",
  description: "Connect Claude, OpenAI, Gemini, or Groq to start analyzing documents.",
};

export default function OnboardingPage() {
  return <ConnectFlow />;
}
