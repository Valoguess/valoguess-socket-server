export const RATE_LIMITS = {
  QUESTION_ASK: {
    maxTokens: 3,
    refillRate: 1,
  },

  QUESTION_ANSWER: {
    maxTokens: 5,
    refillRate: 2,
  },

  GUESS_SUBMIT: {
    maxTokens: 3,
    refillRate: 1,
  },

  CHAT_MESSAGE: {
    maxTokens: 5,
    refillRate: 1,
  },
};