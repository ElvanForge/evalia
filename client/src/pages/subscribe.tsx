import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, BookOpen, School, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment form component
const SubscriptionForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/settings?subscription=success`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Processing",
        description: "Your subscription is being processed!",
      });
      setLocation('/settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

// Main subscription page
export default function SubscribePage() {
  const { user } = useAuth();
  const [, params] = useRoute('/subscribe/:planId');
  const planId = params?.planId || 'pro';
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // Create subscription when component mounts
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    apiRequest("POST", "/api/create-subscription", { plan: planId })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create subscription');
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Subscription error:", err);
        setError(err.message);
        setLoading(false);
        toast({
          title: "Error",
          description: "Could not initiate subscription. Please try again.",
          variant: "destructive",
        });
      });
  }, [planId, user, toast]);

  // Content based on plan type
  const getPlanDetails = () => {
    switch (planId) {
      case 'pro':
        return {
          title: "Pro Plan",
          price: "$12/month",
          description: "Perfect for individual teachers",
          features: [
            "Unlimited classes",
            "Unlimited students",
            "Advanced grading features",
            "Quiz creation with images",
            "Export grades to XML"
          ],
          icon: <BookOpen className="h-12 w-12 text-primary" />
        };
      case 'school':
        return {
          title: "School Plan",
          price: "$299/month",
          description: "For entire school systems",
          features: [
            "Everything in Pro plan",
            "School management dashboard",
            "Administrator oversight",
            "Data analytics",
            "API access",
            "Premium support"
          ],
          icon: <School className="h-12 w-12 text-primary" />
        };
      default:
        return {
          title: "Pro Plan",
          price: "$12/month",
          description: "Perfect for individual teachers",
          features: [
            "Unlimited classes",
            "Unlimited students",
            "Advanced grading features",
            "Quiz creation with images",
            "Export grades to XML"
          ],
          icon: <BookOpen className="h-12 w-12 text-primary" />
        };
    }
  };

  const planDetails = getPlanDetails();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Subscription Error</CardTitle>
            <CardDescription>We encountered an issue setting up your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/settings')}>Return to Settings</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-12">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Upgrade to {planDetails.title}
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Plan details */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{planDetails.title}</CardTitle>
                <CardDescription>{planDetails.description}</CardDescription>
              </div>
              {planDetails.icon}
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">{planDetails.price}</span>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-4">Features included:</h3>
            <ul className="space-y-2">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment form */}
        <Card>
          <CardHeader>
            <CardTitle>Complete your subscription</CardTitle>
            <CardDescription>
              Enter your payment details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscriptionForm plan={planId} />
              </Elements>
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}