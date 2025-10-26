import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Thanks for subscribing!",
      description: "Please check your email to confirm your subscription.",
    });
    setEmail("");
    setFirstName("");
    setLastName("");
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          {/* Left column - Title and form */}
          <div>
            <div className="bg-primary text-primary-foreground p-8 md:p-12 mb-8 inline-block">
              <h1 className="text-5xl md:text-7xl font-bold leading-none">AINews</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-2">by smol.ai</p>
            <p className="text-lg mb-8">How over 80k top AI Engineers keep up, every weekday.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="your@work.email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
              <Input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background"
              />
              <Input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Solve my AI overload
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              We respect your privacy. <a href="/subscribe" className="underline">Full signup link here.</a>
            </p>
          </div>

          {/* Right column - Description and testimonials */}
          <div className="space-y-6">
            <p className="text-lg">
              We summarize top AI discords + AI reddits + AI X/Twitters, and send you a roundup each day!
            </p>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "Highest-leverage 45 mins I spend everyday" - <span className="font-medium">Soumith</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "best AI newsletter atm" and "I'm not sure that enough people subscribe" - <span className="font-medium">Andrej</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "genuinely incredible" - <span className="font-medium">Chris</span>
            </blockquote>

            <blockquote className="italic text-muted-foreground border-l-2 border-border pl-4">
              "surprisingly decent" - <span className="font-medium">Hamel</span>
            </blockquote>

            <p className="text-sm italic text-muted-foreground">
              You can pay for a customizable version here. Thanks to Pieter Levels for the Lex Fridman feature!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
