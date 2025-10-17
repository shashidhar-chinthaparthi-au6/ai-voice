const OpenAI = require('openai');

class EmotionAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Analyze emotional content from text
  async analyzeEmotion(text, context = 'workplace') {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert emotion analyst. Analyze the emotional content of the given text and extract:
            1. Primary emotion (joy, sadness, anger, fear, surprise, disgust, neutral, excitement, frustration, anxiety, contentment, stress)
            2. Emotional intensity (1-10 scale)
            3. Emotional confidence (0-1 scale)
            4. Emotional triggers (what caused the emotion)
            5. Emotional context (work, personal, team, etc.)
            6. Emotional needs (what the person needs emotionally)
            7. Sentiment score (-1 to 1)
            
            Respond with a JSON object containing these fields.`
          },
          {
            role: 'user',
            content: `Text: "${text}"\nContext: ${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        primaryEmotion: analysis.primaryEmotion || 'neutral',
        intensity: Math.max(1, Math.min(10, analysis.intensity || 5)),
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        triggers: analysis.triggers || [],
        context: analysis.context || context,
        needs: analysis.needs || [],
        sentiment: Math.max(-1, Math.min(1, analysis.sentiment || 0))
      };
    } catch (error) {
      console.error('Emotion analysis error:', error);
      return {
        primaryEmotion: 'neutral',
        intensity: 5,
        confidence: 0.3,
        triggers: [],
        context: context,
        needs: [],
        sentiment: 0
      };
    }
  }

  // Generate emotion conversation questions
  generateEmotionQuestions(conversationType = 'daily') {
    const questionTemplates = {
      daily: [
        "How are you feeling right now?",
        "What's the main emotion you're experiencing today?",
        "How would you rate your energy level today?",
        "What's making you feel this way?",
        "How do you feel about your work today?",
        "What emotion do you wish you felt more?",
        "How do you feel about your team today?",
        "What's your emotional state about your current projects?",
        "How do you feel about your role today?",
        "What emotion do you associate with success?",
        "How do you feel about feedback you've received?",
        "What's your emotional outlook for tomorrow?"
      ],
      weekly: [
        "How has your emotional journey been this week?",
        "What was your highest emotional moment this week?",
        "What was your lowest emotional moment this week?",
        "How do you feel about your work-life balance this week?",
        "What emotions did you experience with your colleagues?",
        "How do you feel about your personal growth this week?",
        "What's your emotional outlook for next week?",
        "How supported do you feel by your team this week?",
        "What's one emotion you'd like to feel more of?",
        "How do you feel about your role in the company?",
        "What emotions do you associate with your workplace?",
        "How do you feel about change in the organization?",
        "What emotions do you want to cultivate?",
        "How do you feel about your work environment?",
        "What's your emotional vision for the future?"
      ],
      monthly: [
        "Describe your emotional landscape this month",
        "What patterns do you notice in your emotions?",
        "How has your emotional resilience changed?",
        "What emotions do you associate with your workplace?",
        "How do you feel about your career progression?",
        "What emotional support do you need?",
        "How do you feel about the company culture?",
        "What's your emotional relationship with your manager?",
        "How do you feel about change in the organization?",
        "What emotions do you want to cultivate?",
        "How do you feel about your work environment?",
        "What's your emotional vision for the future?",
        "How do you feel about recognition and feedback?",
        "What emotions do you experience during meetings?",
        "How do you feel about your work impact?"
      ]
    };

    return questionTemplates[conversationType] || questionTemplates.daily;
  }

  // Analyze overall emotional state from conversation
  async analyzeOverallEmotion(conversation) {
    try {
      const allResponses = conversation.questions.map(q => q.userResponse).join(' ');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and provide:
            1. Dominant emotion across all responses
            2. Average emotional intensity (1-10)
            3. Overall emotional state description
            4. Well-being score (1-10)
            5. Stress level (1-10)
            6. Energy level (1-10)
            7. Satisfaction level (1-10)
            
            Respond with JSON format.`
          },
          {
            role: 'user',
            content: `Conversation: ${allResponses}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        dominantEmotion: analysis.dominantEmotion || 'neutral',
        averageIntensity: Math.max(1, Math.min(10, analysis.averageIntensity || 5)),
        emotionalState: analysis.emotionalState || 'balanced',
        wellBeingScore: Math.max(1, Math.min(10, analysis.wellBeingScore || 5)),
        stressLevel: Math.max(1, Math.min(10, analysis.stressLevel || 5)),
        energyLevel: Math.max(1, Math.min(10, analysis.energyLevel || 5)),
        satisfaction: Math.max(1, Math.min(10, analysis.satisfaction || 5))
      };
    } catch (error) {
      console.error('Overall emotion analysis error:', error);
      return {
        dominantEmotion: 'neutral',
        averageIntensity: 5,
        emotionalState: 'balanced',
        wellBeingScore: 5,
        stressLevel: 5,
        energyLevel: 5,
        satisfaction: 5
      };
    }
  }

  // Generate emotional insights
  async generateEmotionalInsights(conversation) {
    try {
      const allResponses = conversation.questions.map(q => q.userResponse).join(' ');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and generate insights:
            1. Emotional patterns (what emotions are most common)
            2. Concerns (what the person is worried about)
            3. Positive factors (what makes them happy)
            4. Recommendations (how to improve their emotional well-being)
            5. Key topics (main themes discussed)
            
            Respond with JSON format.`
          },
          {
            role: 'user',
            content: `Conversation: ${allResponses}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const insights = JSON.parse(response.choices[0].message.content);
      return {
        emotionalPatterns: insights.emotionalPatterns || [],
        concerns: insights.concerns || [],
        positiveFactors: insights.positiveFactors || [],
        recommendations: insights.recommendations || [],
        keyTopics: insights.keyTopics || []
      };
    } catch (error) {
      console.error('Emotional insights generation error:', error);
      return {
        emotionalPatterns: [],
        concerns: [],
        positiveFactors: [],
        recommendations: [],
        keyTopics: []
      };
    }
  }

  // Track emotional patterns over time
  async trackEmotionalPatterns(userId, timeRange = '30d') {
    try {
      const EmotionConversation = require('../models/EmotionConversation');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

      const conversations = await EmotionConversation.find({
        userId: userId,
        createdAt: { $gte: startDate },
        status: 'completed'
      }).sort({ createdAt: 1 });

      if (conversations.length === 0) {
        return {
          dominantEmotions: [],
          emotionalTrends: [],
          emotionalTriggers: [],
          emotionalNeeds: []
        };
      }

      // Extract dominant emotions
      const dominantEmotions = conversations.map(conv => conv.overallEmotion.dominantEmotion);
      const emotionCounts = dominantEmotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});

      // Extract emotional trends
      const emotionalTrends = conversations.map(conv => ({
        date: conv.createdAt,
        mood: conv.overallEmotion.wellBeingScore,
        stress: conv.overallEmotion.stressLevel,
        energy: conv.overallEmotion.energyLevel
      }));

      // Extract emotional triggers
      const allTriggers = conversations.flatMap(conv => 
        conv.questions.flatMap(q => q.emotionAnalysis.triggers)
      );
      const triggerCounts = allTriggers.reduce((acc, trigger) => {
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {});

      // Extract emotional needs
      const allNeeds = conversations.flatMap(conv => 
        conv.questions.flatMap(q => q.emotionAnalysis.needs)
      );
      const needCounts = allNeeds.reduce((acc, need) => {
        acc[need] = (acc[need] || 0) + 1;
        return acc;
      }, {});

      return {
        dominantEmotions: Object.entries(emotionCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([emotion, count]) => ({ emotion, count })),
        emotionalTrends,
        emotionalTriggers: Object.entries(triggerCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([trigger, count]) => ({ trigger, count })),
        emotionalNeeds: Object.entries(needCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([need, count]) => ({ need, count }))
      };
    } catch (error) {
      console.error('Emotional patterns tracking error:', error);
      return {
        dominantEmotions: [],
        emotionalTrends: [],
        emotionalTriggers: [],
        emotionalNeeds: []
      };
    }
  }

  // Generate conversational AI response
  async generateConversationalResponse(conversationContext) {
    try {
      console.log('Full conversation context received:', conversationContext);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Cuby, a supportive AI assistant conducting an emotional check-in conversation. You should:
            1. Be empathetic and understanding
            2. Ask follow-up questions based on what the user shared
            3. Show genuine interest in their feelings
            4. Keep responses conversational and natural (1-2 sentences)
            5. Avoid repeating the same questions
            6. Be encouraging and supportive
            7. Ask about specific aspects they mentioned
            8. Keep the conversation flowing naturally
            9. Reference previous parts of the conversation when relevant
            10. Build on what the user has already shared
            11. Always remember you are Cuby, a caring AI assistant
            
            You have access to the full conversation history. Use it to provide contextual, personalized responses.
            Respond with a natural, conversational follow-up question or comment.`
          },
          {
            role: 'user',
            content: `Here is our full conversation so far:\n\n${conversationContext}\n\nPlease respond naturally to the user's latest message, considering the entire conversation context.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Conversational response generation error:', error);
      // Fallback responses
      const fallbackResponses = [
        "Thank you for sharing. How are you feeling right now?",
        "That's interesting. What's been on your mind lately?",
        "I understand. How has your day been so far?",
        "Thanks for telling me. What's making you feel this way?",
        "I appreciate you sharing. How are things at work?",
        "That sounds important. Can you tell me more about that?",
        "I hear you. What would help you feel better?",
        "Thank you for being open. How are you coping with this?",
        "That's valuable insight. What's your biggest concern right now?",
        "I'm listening. What else would you like to talk about?"
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }
}

module.exports = new EmotionAIService();
