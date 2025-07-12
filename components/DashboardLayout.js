'use client'

import Sidebar from './Sidebar'
import DashboardHeader from '../app/dashboard/DashboardHeader'
import ChatWidget from './ChatWidget'
import NotificationCenter from './NotificationCenter'

export default function DashboardLayout({ user, profile, children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} profile={profile} />
      
      {/* Main Content */}
      <div className="lg:pl-20">
        <DashboardHeader user={user} profile={profile} />
        
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      <NotificationCenter user={user} profile={profile} />
      <ChatWidget user={user} profile={profile} />
    </div>
  )
}