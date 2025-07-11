import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Medical Appointment Booking System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Book your medical appointments online with ease. 
            Available slots from 8:00 AM to 5:00 PM, every 1 hour 30 minutes.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/auth/login"
              className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-block bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Easy Booking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Select your preferred date and time slot from available options.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Secure Records</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your medical information is stored securely and privately.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">No Double Booking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our system prevents conflicts with automatic capacity management.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}