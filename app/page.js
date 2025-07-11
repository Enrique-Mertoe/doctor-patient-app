import Link from 'next/link'
import { 
  Calendar, 
  Shield, 
  Clock, 
  Users, 
  Heart, 
  Star, 
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-3" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">MediCare</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Features</a>
              <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">How it Works</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Testimonials</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Your Health,
                <span className="text-indigo-600 dark:text-indigo-400"> Simplified</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Book appointments with top healthcare providers, manage your medical records, 
                and take control of your health journey with our comprehensive platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Learn More
                </Link>
              </div>
              <div className="mt-8 flex items-center space-x-6">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-300">4.9/5 Rating</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-1" />
                  <span className="text-gray-600 dark:text-gray-300">10,000+ Patients</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Appointment</h3>
                    <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Next Available</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Today 2:30 PM</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Provider</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Dr. Smith</p>
                    </div>
                  </div>
                  <button className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                    Book Appointment
                  </button>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full opacity-60"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-100 dark:bg-purple-900 rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Better Healthcare
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform provides comprehensive tools to manage your health journey from appointment booking to medical records.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Easy Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Book appointments with your preferred healthcare providers in just a few clicks. View real-time availability and choose times that work for you.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Secure Records</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your medical information is encrypted and stored securely. Access your health records anytime, anywhere with complete privacy protection.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">24/7 Access</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access your health information and manage appointments around the clock. Our platform is always available when you need it.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Expert Network</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with a network of verified healthcare professionals across multiple specialties. Find the right expert for your needs.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Health Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your health progress with integrated tracking tools. Keep tabs on medications, appointments, and health metrics.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Reminders</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Never miss an appointment or medication with our intelligent reminder system. Get notifications via email and SMS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get started with healthcare management in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Account</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign up with your email or Google account and complete your health profile in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Find & Book</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Search for healthcare providers, view their availability, and book appointments that fit your schedule.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manage Health</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your appointments, access medical records, and stay on top of your health journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-indigo-600 dark:bg-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who are already managing their healthcare more effectively with MediCare.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-indigo-400 mr-3" />
                <span className="text-2xl font-bold">MediCare</span>
              </div>
              <p className="text-gray-400 mb-4">
                Simplifying healthcare management for everyone.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How it Works</a></li>
                <li><a href="/auth/signup" className="hover:text-white">Get Started</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div id="contact">
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>support@medicare.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>New York, NY</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MediCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}