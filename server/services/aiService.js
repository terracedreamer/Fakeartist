const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

let client = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set — AI features disabled');
      return null;
    }
    client = new Anthropic({ apiKey });
  }
  return client;
};

const FALLBACK_WORDS = {
  animals: ['elephant', 'penguin', 'octopus', 'giraffe', 'dolphin'],
  food: ['pizza', 'sushi', 'taco', 'croissant', 'hamburger'],
  landmarks: ['eiffel tower', 'pyramids', 'statue of liberty', 'big ben', 'taj mahal'],
  objects: ['umbrella', 'telescope', 'bicycle', 'guitar', 'lighthouse'],
  nature: ['volcano', 'waterfall', 'rainbow', 'cactus', 'tornado'],
};

const generateWord = async (difficulty = 'medium') => {
  const anthropic = getClient();
  if (!anthropic) {
    return getFallbackWord();
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Generate a single word or short phrase (max 2 words) for a drawing game. Difficulty: ${difficulty}.
Return ONLY valid JSON: {"word": "the word", "category": "category name"}
The word should be something that can be drawn. Be creative with categories.`,
        },
      ],
    });

    const text = message.content[0].text.trim();
    const parsed = JSON.parse(text);
    return { word: parsed.word.toLowerCase(), category: parsed.category, source: 'ai' };
  } catch (error) {
    logger.error('AI word generation failed, using fallback:', error.message);
    return getFallbackWord();
  }
};

const getFallbackWord = () => {
  const categories = Object.keys(FALLBACK_WORDS);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const words = FALLBACK_WORDS[category];
  const word = words[Math.floor(Math.random() * words.length)];
  return { word, category, source: 'fallback' };
};

const generatePostRoundAnalysis = async (strokes, players, word, fakeArtistId) => {
  const anthropic = getClient();
  if (!anthropic) {
    return null;
  }

  try {
    const playerSummaries = players.map((p) => {
      const playerStrokes = strokes.filter(
        (s) => s.playerId.toString() === p._id.toString()
      );
      const isFake = p._id.toString() === fakeArtistId.toString();
      return `${p.username}: ${playerStrokes.length} strokes, ${isFake ? '(FAKE ARTIST)' : '(real artist)'}`;
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You're a dramatic art critic commentating on a drawing game round. The secret word was "${word}".
Players and their contributions:
${playerSummaries.join('\n')}

Write a short, funny, dramatic 2-3 sentence analysis building tension before the vote. Don't reveal who the fake artist is, but hint at suspicious behavior. Be entertaining.
Return ONLY valid JSON: {"analysis": "your analysis text"}`,
        },
      ],
    });

    const text = message.content[0].text.trim();
    const parsed = JSON.parse(text);
    return parsed.analysis;
  } catch (error) {
    logger.error('AI analysis generation failed:', error.message);
    return null;
  }
};

module.exports = { generateWord, generatePostRoundAnalysis };
