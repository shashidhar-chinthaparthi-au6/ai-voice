const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }


  async analyzeSentiment(text) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the following text and respond with a JSON object containing "score" (number from -1 to 1) and "label" (positive, negative, or neutral).'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        score: analysis.score,
        label: analysis.label
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        score: 0,
        label: 'neutral'
      };
    }
  }

  async generateSurveyInsights(responses, surveyQuestions) {
    try {
      const prompt = this.buildInsightsPrompt(responses, surveyQuestions);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert survey analyst. Analyze the provided survey responses and generate actionable insights. Respond with a JSON object containing "summary", "keyFindings", "recommendations", and "trends".'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Insights generation error:', error);
      return {
        summary: 'Unable to generate insights at this time',
        keyFindings: [],
        recommendations: [],
        trends: []
      };
    }
  }

  async generateQuestionSuggestions(surveyContext, currentQuestions) {
    try {
      const prompt = `Based on the survey context: "${surveyContext}" and current questions: ${JSON.stringify(currentQuestions)}, suggest 3-5 additional questions that would provide valuable insights. Focus on questions that can capture emotional responses and cultural nuances.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert survey designer specializing in cultural research and data collection. Suggest relevant questions that can capture emotional and cultural insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Question suggestions error:', error);
      return 'Unable to generate question suggestions at this time';
    }
  }

  buildInsightsPrompt(responses, surveyQuestions) {
    const questionTexts = surveyQuestions.map(q => q.text).join(', ');
    const responseData = responses.map(r => ({
      questionId: r.questionId,
      answer: r.answer,
      sentiment: r.sentiment,
      transcription: r.transcription
    }));

    return `
Survey Questions: ${questionTexts}

Response Data:
${JSON.stringify(responseData, null, 2)}

Please analyze these responses and provide insights about:
1. Overall sentiment trends
2. Key themes and patterns
3. Cultural insights
4. Recommendations for improvement
5. Notable quotes or responses
    `;
  }

}

module.exports = new AIService();
