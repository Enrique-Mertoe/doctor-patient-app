'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

export default function ChatWidget({ user, profile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [newChatForm, setNewChatForm] = useState({
    recipient_id: '',
    subject: '',
    message: ''
  })
  const [availableContacts, setAvailableContacts] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
      fetchAvailableContacts()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchAvailableContacts = async () => {
    try {
      const endpoint = profile.role === 'patient' ? '/api/doctors' : '/api/patients'
      const response = await fetch(endpoint)
      const data = await response.json()
      if (data.doctors || data.patients) {
        setAvailableContacts(data.doctors || data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      const data = await response.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return

    setLoading(true)
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          message_text: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(activeConversation.id)
        fetchConversations() // Update last message time
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
    setLoading(false)
  }

  const startNewConversation = async () => {
    if (!newChatForm.recipient_id || !newChatForm.message) return

    setLoading(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          other_user_id: newChatForm.recipient_id,
          subject: newChatForm.subject || 'General Inquiry',
          message: newChatForm.message
        })
      })

      const data = await response.json()
      if (response.ok && data.conversation) {
        setShowNewChatModal(false)
        setNewChatForm({ recipient_id: '', subject: '', message: '' })
        fetchConversations()
        setActiveConversation(data.conversation)
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
    setLoading(false)
  }

  const getOtherPartyName = (conversation) => {
    if (profile.role === 'patient') {
      return `Dr. ${conversation.doctors?.name}`
    } else {
      return conversation.patients?.full_name
    }
  }

  const unreadCount = conversations.filter(conv => 
    messages.some(msg => 
      msg.conversation_id === conv.id && 
      !msg.is_read && 
      msg.sender_id !== user.id
    )
  ).length

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-colors relative"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-medium">
          {activeConversation ? getOtherPartyName(activeConversation) : 'Messages'}
        </h3>
        <div className="flex items-center space-x-2">
          {!activeConversation && (
            <button
              onClick={() => setShowNewChatModal(true)}
              className="text-white hover:text-indigo-200 text-sm"
            >
              ✏️
            </button>
          )}
          {activeConversation && (
            <button
              onClick={() => setActiveConversation(null)}
              className="text-white hover:text-indigo-200 text-sm"
            >
              ←
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-indigo-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeConversation ? (
          /* Conversations List */
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <p>No conversations yet</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getOtherPartyName(conversation)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.subject}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {format(new Date(conversation.last_message_at), 'MMM d')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Messages View */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.sender_id === user.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p>{message.message_text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === user.id ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Start New Conversation
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {profile.role === 'patient' ? 'Select Doctor' : 'Select Patient'}
                </label>
                <select
                  value={newChatForm.recipient_id}
                  onChange={(e) => setNewChatForm({...newChatForm, recipient_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose...</option>
                  {availableContacts.map((contact) => (
                    <option key={contact.user_id} value={contact.user_id}>
                      {profile.role === 'patient' 
                        ? `Dr. ${contact.name} - ${contact.specialization}`
                        : contact.full_name
                      }
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={newChatForm.subject}
                  onChange={(e) => setNewChatForm({...newChatForm, subject: e.target.value})}
                  placeholder="What is this about?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={newChatForm.message}
                  onChange={(e) => setNewChatForm({...newChatForm, message: e.target.value})}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={startNewConversation}
                disabled={loading || !newChatForm.recipient_id || !newChatForm.message}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {loading ? 'Starting...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}