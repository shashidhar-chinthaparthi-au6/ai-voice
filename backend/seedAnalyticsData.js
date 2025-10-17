const mongoose = require('mongoose');
const ConversationAnalytics = require('./models/ConversationAnalytics');
const EmotionConversation = require('./models/EmotionConversation');
const User = require('./models/User');
const Tenant = require('./models/Tenant');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-culture-survey', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedAnalyticsData() {
  try {
    console.log('Starting to seed analytics data...');

    // Get or create a tenant
    let tenant = await Tenant.findOne();
    if (!tenant) {
      tenant = new Tenant({
        name: 'Test Company',
        domain: 'testcompany.com',
        settings: {
          analyticsEnabled: true,
          dataRetentionDays: 365
        }
      });
      await tenant.save();
      console.log('Created tenant:', tenant.name);
    }

    // Get or create a user
    let user = await User.findOne();
    if (!user) {
      user = new User({
        name: 'Test User',
        email: 'test@testcompany.com',
        password: 'hashedpassword',
        role: 'user',
        tenantId: tenant._id
      });
      await user.save();
      console.log('Created user:', user.email);
    }

    // Create sample emotion conversations
    const sampleConversations = [];
    for (let i = 0; i < 10; i++) {
      const conversation = new EmotionConversation({
        tenantId: tenant._id,
        userId: user._id,
        sessionId: `session_${i}_${Date.now()}`,
        conversationType: ['daily', 'weekly', 'monthly'][i % 3],
        questions: [
          {
            questionId: `q1_${i}`,
            questionText: 'How are you feeling today?',
            questionType: 'open_ended',
            userResponse: `I'm feeling ${['good', 'okay', 'stressed', 'happy', 'tired'][i % 5]} today.`,
            responseLength: 25 + (i * 5),
            responseTime: 10 + (i * 2),
            emotionAnalysis: {
              primaryEmotion: ['happy', 'neutral', 'stressed', 'excited', 'calm'][i % 5],
              secondaryEmotions: ['content', 'anxious'][i % 2],
              intensity: 5 + (i % 5),
              confidence: 0.7 + (i * 0.02),
              triggers: ['work', 'family'][i % 2],
              context: 'Daily check-in',
              needs: ['support', 'recognition'][i % 2],
              sentiment: -0.5 + (i * 0.2),
              emotionalComplexity: 3 + (i % 4),
              emotionalStability: 6 + (i % 3)
            },
            timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            userEngagement: {
              timeSpent: 30 + (i * 5),
              pauses: [2, 3, 1][i % 3],
              interruptions: i % 3,
              hesitation: i % 2 === 0
            }
          }
        ],
        overallEmotion: {
          dominantEmotion: ['happy', 'neutral', 'stressed'][i % 3],
          averageIntensity: 5 + (i % 4),
          emotionalState: ['positive', 'neutral', 'negative'][i % 3],
          wellBeingScore: 6 + (i % 3),
          stressLevel: 4 + (i % 4),
          energyLevel: 5 + (i % 4),
          satisfaction: 6 + (i % 3)
        },
        insights: {
          emotionalPatterns: ['consistent', 'variable'][i % 2],
          concerns: ['workload', 'relationships'][i % 2],
          positiveFactors: ['support', 'achievements'][i % 2],
          recommendations: ['stress_management', 'self_care'][i % 2],
          keyTopics: ['work', 'health', 'relationships'][i % 3]
        },
        contextualFactors: {
          timeOfDay: ['morning', 'afternoon', 'evening'][i % 3],
          dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
          season: ['spring', 'summer', 'autumn', 'winter'][i % 4],
          externalEvents: ['meeting', 'deadline'][i % 2],
          workload: 5 + (i % 4),
          weather: ['sunny', 'cloudy', 'rainy'][i % 3],
          location: ['office', 'home', 'remote'][i % 3],
          device: ['desktop', 'mobile', 'tablet'][i % 3]
        },
        interactionPatterns: {
          conversationFlow: ['linear', 'branching', 'adaptive'][i % 3],
          questionTypes: ['open_ended', 'rating'][i % 2],
          responseLengths: [20 + (i * 3), 30 + (i * 2)],
          userEngagement: {
            totalTimeSpent: 120 + (i * 10),
            averageResponseTime: 15 + (i * 2),
            totalPauses: 2 + (i % 3),
            totalInterruptions: i % 2,
            hesitationCount: i % 3,
            engagementScore: 6 + (i % 3)
          },
          conversationEffectiveness: {
            clarityScore: 7 + (i % 2),
            depthScore: 6 + (i % 2),
            opennessScore: 7 + (i % 2),
            trustScore: 6 + (i % 2)
          }
        },
        historicalContext: {
          previousMood: 5 + (i % 3),
          trendDirection: ['improving', 'stable', 'declining'][i % 3],
          recurringThemes: ['work', 'health'][i % 2],
          progressIndicators: {
            emotionalGrowth: 5 + (i % 3),
            stressManagement: 6 + (i % 2),
            selfAwareness: 5 + (i % 3),
            copingStrategies: 6 + (i % 2)
          },
          baselineComparison: {
            moodVsBaseline: -1 + (i % 3),
            stressVsBaseline: -1 + (i % 3),
            energyVsBaseline: -1 + (i % 3),
            satisfactionVsBaseline: -1 + (i % 3)
          }
        },
        status: 'completed',
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 300000)
      });
      
      await conversation.save();
      sampleConversations.push(conversation);
      console.log(`Created conversation ${i + 1}`);
    }

    // Create sample analytics data
    for (let i = 0; i < 10; i++) {
      const conversation = sampleConversations[i];
      
      const analytics = new ConversationAnalytics({
        tenantId: tenant._id,
        userId: user._id,
        conversationId: conversation._id,
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        conversationType: conversation.conversationType,
        metrics: {
          totalMessages: 2,
          userMessages: 1,
          aiMessages: 1,
          conversationDuration: 120 + (i * 10),
          averageResponseTime: 15 + (i * 2),
          sentimentScore: -0.3 + (i * 0.1),
          emotionalIntensity: 5 + (i % 4),
          wellBeingScore: 6 + (i % 3),
          stressLevel: 4 + (i % 4),
          energyLevel: 5 + (i % 4),
          satisfactionLevel: 6 + (i % 3)
        },
        emotionalInsights: {
          dominantEmotions: [
            { emotion: 'happy', intensity: 6, frequency: 1 },
            { emotion: 'neutral', intensity: 5, frequency: 1 }
          ],
          emotionalTriggers: [
            { trigger: 'work', frequency: 1, impact: 6 },
            { trigger: 'family', frequency: 1, impact: 5 }
          ],
          emotionalNeeds: [
            { need: 'support', frequency: 1, priority: 7 },
            { need: 'recognition', frequency: 1, priority: 6 }
          ],
          moodPatterns: [
            { pattern: 'morning_energy', frequency: 1, description: 'Higher energy in morning' }
          ]
        },
        topics: [
          {
            topic: 'work',
            frequency: 1,
            sentiment: 0.2,
            keywords: ['project', 'deadline', 'meeting']
          },
          {
            topic: 'health',
            frequency: 1,
            sentiment: 0.1,
            keywords: ['exercise', 'sleep', 'diet']
          }
        ],
        qualityMetrics: {
          engagement: 6 + (i % 3),
          openness: 7 + (i % 2),
          trust: 6 + (i % 2),
          satisfaction: 6 + (i % 3),
          helpfulness: 7 + (i % 2)
        },
        aiPerformance: {
          responseRelevance: 7 + (i % 2),
          empathyLevel: 6 + (i % 3),
          questionQuality: 7 + (i % 2),
          contextualAwareness: 6 + (i % 3)
        },
        recommendations: [
          {
            type: 'emotional_support',
            priority: i % 2 === 0 ? 'high' : 'medium',
            description: 'Consider stress management techniques',
            actionable: true
          }
        ],
        conversationSummary: {
          keyPoints: ['User feeling positive', 'Work stress mentioned'],
          concerns: ['Workload management'],
          positiveAspects: ['Good energy levels'],
          areasForImprovement: ['Stress management']
        },
        contextualAnalysis: {
          timeOfDay: ['morning', 'afternoon', 'evening'][i % 3],
          dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'][i % 5],
          season: ['spring', 'summer', 'autumn', 'winter'][i % 4],
          externalEvents: ['meeting', 'deadline'][i % 2],
          workload: 5 + (i % 4),
          weather: ['sunny', 'cloudy', 'rainy'][i % 3],
          location: ['office', 'home', 'remote'][i % 3],
          device: ['desktop', 'mobile', 'tablet'][i % 3],
          impactOnMood: -1 + (i % 3),
          environmentalStressors: ['high_workload', 'deadline_pressure'][i % 2],
          environmentalSupports: ['good_weather', 'comfortable_environment'][i % 2]
        },
        interactionAnalysis: {
          conversationFlow: ['linear', 'branching', 'adaptive'][i % 3],
          questionTypes: ['open_ended', 'rating'][i % 2],
          responsePatterns: {
            averageLength: 25 + (i * 3),
            lengthVariance: 5 + (i % 3),
            complexityScore: 6 + (i % 3),
            emotionalDepth: 5 + (i % 4)
          },
          engagementMetrics: {
            totalTimeSpent: 120 + (i * 10),
            averageResponseTime: 15 + (i * 2),
            pauseFrequency: 2 + (i % 3),
            interruptionCount: i % 2,
            hesitationCount: i % 3,
            engagementScore: 6 + (i % 3)
          },
          effectivenessMetrics: {
            clarityScore: 7 + (i % 2),
            depthScore: 6 + (i % 2),
            opennessScore: 7 + (i % 2),
            trustScore: 6 + (i % 2),
            overallEffectiveness: 6.5 + (i * 0.1)
          }
        },
        historicalAnalysis: {
          previousMood: 5 + (i % 3),
          trendDirection: ['improving', 'stable', 'declining'][i % 3],
          recurringThemes: ['work', 'health'][i % 2],
          progressIndicators: {
            emotionalGrowth: 5 + (i % 3),
            stressManagement: 6 + (i % 2),
            selfAwareness: 5 + (i % 3),
            copingStrategies: 6 + (i % 2)
          },
          baselineComparison: {
            moodVsBaseline: -1 + (i % 3),
            stressVsBaseline: -1 + (i % 3),
            energyVsBaseline: -1 + (i % 3),
            satisfactionVsBaseline: -1 + (i % 3)
          },
          trendAnalysis: {
            shortTermTrend: 'stable',
            mediumTermTrend: 'improving',
            longTermTrend: 'stable',
            volatilityIndex: 3 + (i % 3)
          }
        },
        predictiveInsights: {
          riskFactors: ['burnout', 'stress'][i % 2],
          improvementAreas: ['time_management', 'work_life_balance'][i % 2],
          successIndicators: ['positive_attitude', 'engagement'][i % 2],
          interventionRecommendations: ['stress_management', 'mindfulness'][i % 2],
          predictedOutcomes: {
            nextWeekMood: 6 + (i % 3),
            nextWeekStress: 4 + (i % 4),
            nextWeekEnergy: 5 + (i % 4),
            confidence: 0.7 + (i * 0.02)
          },
          earlyWarningSignals: ['increased_stress', 'decreased_energy'][i % 2],
          opportunityAreas: ['skill_development', 'networking'][i % 2]
        },
        comparativeAnalytics: {
          peerComparison: {
            departmentAverage: { wellBeing: 6.5, stress: 5.2 },
            roleAverage: { wellBeing: 6.8, stress: 4.9 },
            experienceLevelAverage: { wellBeing: 7.1, stress: 4.5 },
            percentileRanking: 60 + (i * 2)
          },
          industryBenchmarks: {
            industryAverage: { wellBeing: 6.5, stress: 5.0, satisfaction: 6.8 },
            bestPractices: ['regular_check_ins', 'stress_management_training'],
            benchmarkComparison: { wellBeing: 0.5, stress: -0.5, satisfaction: 0.2 }
          },
          personalBaseline: {
            historicalAverage: { wellBeing: 6.2, stress: 5.5, satisfaction: 6.5 },
            improvementAreas: ['stress_management', 'work_life_balance'],
            strengthAreas: ['emotional_awareness', 'communication']
          }
        },
        actionTracking: {
          recommendationsGiven: [
            {
              type: 'emotional_support',
              description: 'Consider stress management techniques',
              priority: i % 2 === 0 ? 'high' : 'medium',
              givenAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
            }
          ],
          actionsTaken: [],
          followUpRequired: i % 2 === 0,
          followUpDate: new Date(Date.now() + (7 - i) * 24 * 60 * 60 * 1000),
          interventionHistory: []
        }
      });

      await analytics.save();
      console.log(`Created analytics ${i + 1}`);
    }

    console.log('Analytics data seeded successfully!');
    console.log(`Created ${sampleConversations.length} conversations and analytics records`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedAnalyticsData();
