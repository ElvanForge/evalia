import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Award, BarChart2, BookOpen, Users } from "lucide-react";

// Import the custom illustrations and logo
import EvaliaLogo from "@/assets/evalia-logo.svg";
import teacherIllustration from "@/assets/images/teacher-illustration.svg";
import analyticsIllustration from "@/assets/images/analytics-illustration.svg";
import quizIllustration from "@/assets/images/quiz-illustration.svg";

export default function Landing() {
  // Set page title
  useEffect(() => {
    document.title = "Evalia - Intelligent Education Analytics";
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img src={EvaliaLogo} alt="Evalia Logo" className="h-8 w-8 bg-white rounded-full p-1" />
            <span className="ml-2 text-xl font-bold text-white">Evalia</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-teal-700 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-white text-teal-600 hover:bg-gray-100">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Track, Analyze, and <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400">Elevate</span> Student Performance
              </h1>
              <p className="mt-4 text-xl text-gray-600">
                Empower your teaching with Evalia's intelligent grade tracking and analytics platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button size="lg" className="px-8">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="px-8">
                    Log In
                  </Button>
                </Link>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-500">No credit card required • Free 30-day trial</p>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src={teacherIllustration}
                alt="Teacher with analytics" 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Succeed</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Evalia brings all the tools educators need into one seamless platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mb-5">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Intelligent Grading
                </h3>
                <p className="text-gray-600">
                  Automatically calculate and assign letter grades based on customizable grading scales.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-teal-500 mr-2" />
                    <span className="text-gray-600">Custom grading scales</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-teal-500 mr-2" />
                    <span className="text-gray-600">Letter grade automation</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-teal-500 mr-2" />
                    <span className="text-gray-600">Weighted assignments</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-5">
                  <BarChart2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Comprehensive Analytics
                </h3>
                <p className="text-gray-600">
                  Gain valuable insights into student performance with detailed analytics and visual reports.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-600">Performance trends</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-600">Class comparisons</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-600">Exportable reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-5">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Interactive Quizzes
                </h3>
                <p className="text-gray-600">
                  Create, distribute, and grade quizzes with automatic scoring and detailed feedback.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-gray-600">Multiple question types</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-gray-600">Image uploads</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-gray-600">Automatic grading</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Showcase Sections */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Showcase 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Intelligent Analytics at Your Fingertips</h2>
              <p className="mt-4 text-lg text-gray-600">
                Visualize student performance, identify trends, and make data-driven decisions to enhance teaching methodologies and improve student outcomes.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Track progress across multiple classes and assignments</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Identify struggling students early with at-risk indicators</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Generate comprehensive reports for parent-teacher conferences</p>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/auth/register">
                  <Button className="group">
                    Start Analyzing
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <img 
                src={analyticsIllustration} 
                alt="Analytics dashboard" 
                className="max-w-full h-auto shadow-lg rounded-lg" 
              />
            </div>
          </div>
          
          {/* Showcase 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
            <div className="md:order-2">
              <h2 className="text-3xl font-bold text-gray-900">Interactive Quiz Management</h2>
              <p className="mt-4 text-lg text-gray-600">
                Create engaging assessments with our intuitive quiz builder. Support for multiple question types, image uploads, and automated grading saves valuable teaching time.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Multiple choice, fill-in-the-blank, and short answer formats</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Include images and rich media in questions</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center mt-1">
                    <Check className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="ml-3 text-gray-600">Immediately integrate quiz results into the grade book</p>
                </li>
              </ul>
              <div className="mt-8">
                <Link href="/auth/register">
                  <Button className="group">
                    Create Quizzes
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center md:order-1">
              <img 
                src={quizIllustration} 
                alt="Quiz builder" 
                className="max-w-full h-auto shadow-lg rounded-lg" 
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Spacer for better layout */}
      <div className="py-10 bg-white"></div>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that's right for your classroom or school
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <Card className="border-0 shadow-lg transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-gray-200 text-gray-700 px-3 py-1 text-sm font-medium rounded-bl-lg">
                BETA
              </div>
              <CardContent className="pt-8 pb-6 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline my-4">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-6">Perfect for individual teachers just getting started.</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Up to 30 students</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>5 classes</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Quiz builder (10 quizzes)</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <Link href="/auth/register?plan=free">
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              </div>
            </Card>
            
            {/* Pro Tier */}
            <Card className="border-0 shadow-2xl transition-shadow relative overflow-hidden flex flex-col scale-105 border-2 border-teal-500 z-10">
              <div className="absolute top-0 right-0 bg-teal-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                POPULAR
              </div>
              <CardContent className="pt-8 pb-6 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline my-4">
                  <span className="text-4xl font-extrabold">$12</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-6">For dedicated teachers who want deeper insights.</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited students</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited classes</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced analytics & insights</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited quizzes</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>XML grade exports</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority email support</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 bg-teal-50 border-t border-teal-100">
                <Link href="/auth/register?plan=pro">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">Subscribe Now</Button>
                </Link>
                <p className="text-center text-xs text-gray-500 mt-2">30-day free trial, cancel anytime</p>
              </div>
            </Card>
            
            {/* School Tier */}
            <Card className="border-0 shadow-lg transition-shadow relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                ENTERPRISE
              </div>
              <CardContent className="pt-8 pb-6 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">School</h3>
                <div className="flex items-baseline my-4">
                  <span className="text-4xl font-extrabold">$299</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
                <p className="text-gray-600 mb-6">For entire schools with advanced management needs.</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>All Professional features</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Unlimited teachers</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>School-wide analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Manager accounts</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>SIS integration</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-teal-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <Link href="/auth/register?plan=school">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
                <p className="text-center text-xs text-gray-500 mt-2">Custom implementation available</p>
              </div>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Beta Tester Program</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              We're looking for educators to help us improve Evalia. Join our beta program for free access to all Professional features and the opportunity to shape the future of education analytics.
            </p>
            <Link href="/auth/register?plan=beta">
              <Button variant="outline" className="border-teal-500 text-teal-600 hover:bg-teal-50">
                Apply for Beta Program
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-teal-600 to-teal-400">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to transform your teaching?</h2>
          <p className="mt-4 text-xl text-white text-opacity-90">
            Join thousands of educators who are saving time and improving outcomes with Evalia.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="#pricing">
              <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 px-8">
                View Pricing
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                Log In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white text-opacity-80">
            No credit card required for trial • Cancel anytime
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <img src={EvaliaLogo} alt="Evalia Logo" className="h-8 w-8 bg-white rounded-full p-1" />
                <span className="ml-2 text-xl font-bold">Evalia</span>
              </div>
              <p className="mt-2 text-gray-400">
                Intelligent education analytics for the modern classroom.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Evalia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}