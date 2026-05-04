import Groq from 'groq-sdk';
import config from '../config.js';
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const TASK_PROMPTS = {
  'ai.report': (payload) => `
    Write a comprehensive professional report on the following topic:
    Topic: ${payload.topic}
    
    Structure your report with:
    - Executive Summary
    - Key Findings
    - Analysis
    - Conclusion
    
    Be detailed and professional.
  `,
  'ai.summarize': (payload) => `
    Summarize the following text concisely in 3-5 sentences capturing the most important points:
    ${payload.text}
  `,
  'ai.analyze': (payload) => `
    Perform a deep analysis of the following topic or text:
    ${payload.topic || payload.text}
    
    Structure your analysis with:
    - Core Problem or Context
    - Key Patterns and Trends
    - Strengths and Weaknesses
    - Risks and Opportunities
    - Strategic Recommendations
    
    Be analytical, objective, and thorough.
  `,
  'ai.classify': (payload) => `
    Classify the following text into one of these categories: ${payload.categories.join(', ')}
    
    Text: ${payload.text}
    
    Respond with just the category name and a one sentence justification.
  `,
  'ai.extract': (payload) => `
    Extract all key information from the following text:
    ${payload.text}
    
    Return a JSON object containing:
    - entities: list of key people, organizations, locations, dates mentioned
    - key_facts: list of the most important factual statements
    - action_items: any tasks or actions mentioned
    - summary: one sentence overview
    
    Return only valid JSON, no extra text.
  `,
};

export const runInference = async (type, payload) => {
  const promptBuilder = TASK_PROMPTS[type];

  if (!promptBuilder) {
    throw new Error(`Unknown task type: ${type}`);
  }

  const prompt = promptBuilder(payload);

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
};