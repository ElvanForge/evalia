import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ plan }: { plan: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard?payment_success=true',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed...",
      });
      // Navigation will be handled by the return_url
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <Card>
        <CardContent className="pt-6">
          <PaymentElement />
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auth/register')}
            disabled={processing}
          >
            Back
          </Button>
          <Button type="submit" disabled={!stripe || processing}>
            {processing ? 'Processing...' : `Pay Now`}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [plan, setPlan] = useState("pro");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract the plan from the URL query parameters
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const planFromUrl = searchParams.get('plan');
    
    if (planFromUrl) {
      setPlan(planFromUrl);
    }

    // Create PaymentIntent as soon as the page loads
    setLoading(true);
    apiRequest("POST", "/api/create-payment-intent", { 
      plan: planFromUrl || plan,
      amount: planFromUrl === 'school' ? 299 : 12 // default to pro price
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create payment intent');
        }
        return res.json();
      })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [location]);

  const planTitle = plan === 'pro' ? 'Professional' : 
                    plan === 'school' ? 'School' : 
                    'Subscription';

  const planPrice = plan === 'school' ? '$299' : '$12';

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>There was a problem processing your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/register'}
              className="w-full"
            >
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your {planTitle} Subscription</h1>
          <p className="text-gray-600 mt-2">
            You're subscribing to the {planTitle} plan at {planPrice}/month
          </p>
        </div>
        
        {/* Make SURE to wrap the form in <Elements> which provides the stripe context. */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm plan={plan} />
        </Elements>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your payment information is securely processed by Stripe.</p>
          <p className="mt-2">You can cancel your subscription at any time.</p>
        </div>
      </div>
    </div>
  );
}