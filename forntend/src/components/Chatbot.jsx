import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm ShareBot, your AI assistant. How can I help you regarding food redistribution?", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setInput('');
        setIsLoading(true);

        const getFallbackReply = (text) => {
            const lowerPrompt = text.toLowerCase();
            if (lowerPrompt.includes('donate')) return "To donate food, please go to the 'New Donation' page. Specify the quantity and expiry time.";
            if (lowerPrompt.includes('ngo') || lowerPrompt.includes('volunteer')) return "NGOs and volunteers can view available donations on their dashboard and accept pickups instantly.";
            if (lowerPrompt.includes('match') || lowerPrompt.includes('how')) return "Our Smart Matching uses GPS (2.5km) to connect donors with nearby volunteers for quick pickups.";
            if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) return "Hello! I'm ShareBot. How can I help you reduce food waste today?";
            return "I'm currently in 'Basic Mode' because my AI brain is a bit busy. I coordinate food donations and pickups – feel free to ask about those!";
        };

        try {
            // Use simplified history (max 6)
            const chatHistory = messages.slice(-6).map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            // Use the centralized API service
            const { data } = await API.post('/chatbot', {
                message: userMsg,
                history: chatHistory
            });

            if (data.success) {
                setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
            } else {
                // Fallback if success: false
                setMessages(prev => [...prev, { text: getFallbackReply(userMsg), sender: 'bot' }]);
            }
        } catch (error) {
            console.error('Chat AI failure, falling back:', error);
            // Revert to keyword-based chatbot if Gemini fails
            setMessages(prev => [...prev, { text: getFallbackReply(userMsg), sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`ai-chatbot-btn ${!isOpen ? 'pulse-animation' : ''}`}
                onClick={toggleChat}
                style={{ background: isOpen ? '#ef4444' : 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)' }}
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={chatWindowStyle} className="glass-card">
                    <div style={chatHeaderStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🤖</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>ShareBot AI</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Always here to help</p>
                            </div>
                        </div>
                    </div>

                    <div style={chatBodyStyle}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={msg.sender === 'user' ? userMessageStyle : botMessageStyle}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ ...botMessageStyle, width: '60px', textAlign: 'center' }}>
                                <span className="typing-dots">...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} style={chatInputFlexStyle}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            style={chatInputStyle}
                        />
                        <button type="submit" style={chatSendBtnStyle} disabled={isLoading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

// Inline Styles for Chatbot
const chatWindowStyle = {
    position: 'fixed',
    bottom: '100px',
    right: '2rem',
    width: '350px',
    height: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 9998,
    border: '1px solid rgba(0,0,0,0.08)'
};

const chatHeaderStyle = {
    background: 'linear-gradient(135deg, var(--accent-blue), #8b5cf6)',
    padding: '1rem',
    color: 'white'
};

const chatBodyStyle = {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: '#f8fafc'
};

const messageBaseStyle = {
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    maxWidth: '85%',
    fontSize: '0.95rem',
    lineHeight: '1.4'
};

const userMessageStyle = {
    ...messageBaseStyle,
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '0.25rem'
};

const botMessageStyle = {
    ...messageBaseStyle,
    backgroundColor: 'white',
    color: 'var(--text-main)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '0.25rem',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
};

const chatInputFlexStyle = {
    display: 'flex',
    padding: '1rem',
    backgroundColor: 'white',
    borderTop: '1px solid #e2e8f0',
    gap: '0.5rem'
};

const chatInputStyle = {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '2rem',
    border: '1px solid #cbd5e1',
    outline: 'none',
    fontSize: '0.95rem'
};

const chatSendBtnStyle = {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '1.2rem',
    transition: 'transform 0.2s'
};

export default Chatbot;
