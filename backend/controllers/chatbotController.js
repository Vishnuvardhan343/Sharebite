const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Chat with Gemini AI
// @route   POST /api/chatbot
// @access  Public (or Private depending on choice)
const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // --- STEP 1: Local Keyword Match (To save API quota and prevent "similar" repetitive errors) ---
        const lowerMsg = message.toLowerCase().trim();
        if (lowerMsg === 'hi' || lowerMsg === 'hello' || lowerMsg === 'hlo' || lowerMsg === 'hey') {
            return res.status(200).json({ 
                success: true, 
                reply: "Hello! I'm ShareBot. I'm here to help you reduce food waste. How can I assist you today? (e.g., 'How to donate?' or 'What is ShareBite?')" 
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes('PLACEHOLDER')) {
            return res.status(200).json({ 
                success: true, 
                reply: "I'm currently in basic mode. How can I help you regarding food redistribution?" 
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // System context
        const systemPrompt = `You are "ShareBot", the official AI assistant for ShareBite. 
        ShareBite is a MERN stack platform dedicated to food waste redistribution. 
        It connects Donors (restaurants, individuals) with NGOs and Volunteers.
        Key Features: Donors post food, Volunteers/NGOs pickup. Smart Matching uses GPS (2.5km).
        Tone: Professional, helpful, concise.`;

        // Using gemini-1.5-flash which is standard. 
        // We prepend the system prompt if there's no history to set the character.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 500 },
        });

        // Prepend system context to the first user message if history is empty
        const prompt = (history && history.length > 0) ? message : `${systemPrompt}\n\nUser: ${message}`;
        
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ success: true, reply: text });

    } catch (error) {
        console.error('Chatbot Controller Error:', error.message);
        
        // Handle common Gemini API errors gracefully
        if (error.status === 429 || error.message.includes('429')) {
            return res.status(200).json({ 
                success: true, 
                reply: "I'm receiving a lot of messages right now! 😅 Could you wait a few seconds and try again? I'm eager to help!" 
            });
        }

        if (error.status === 404 || error.message.includes('404')) {
            return res.status(200).json({ 
                success: true, 
                reply: "I'm doing some quick brain maintenance. I coordinate food donations and pickups – feel free to ask about those!" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error',
            error: error.message 
        });
    }
};

module.exports = { chatWithAI };
