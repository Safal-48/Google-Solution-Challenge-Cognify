/**
 * High-Fidelity Mock AI Service
 */

const generateMockChatResponse = (message) => {
  const msg = message.toLowerCase()
  
  if (msg.includes('machine learning')) {
    return `**Machine Learning** is a way to teach computers to learn from data. Instead of writing rules, we give them examples.

1. **Supervised**: We tell them the answers.
2. **Unsupervised**: They find their own patterns.
3. **Deep Learning**: Uses layers like a human brain.

Would you like a quiz on this?`
  }
  
  if (msg.includes('newton') || msg.includes('motion')) {
    return "Newton's laws explain how things move! \n\n1. Objects stay still unless pushed. \n2. Pushing harder makes things go faster. \n3. Pushing something pushes you back too."
  }

  if (msg.includes('photosynthesis')) {
    return "Photosynthesis is how plants make food using sunlight, water, and air. They breathe in CO2 and breathe out the Oxygen we need!"
  }

  return `I understand you're asking about **"${message}"**. 

In simple terms, this is a subject that helps us understand the world better. It uses logic and research to find answers. 

Try the **"AI Notes"** or **"Quiz"** section to learn more about this specific topic!`
}

const generateMockQuiz = (topic, count = 5) => {
  const t = topic.toLowerCase()
  if (t.includes('javascript') || t.includes('js')) {
    return [
      { question: "What is 'typeof null'?", options: ["null", "undefined", "object", "number"], correctAnswer: 2, explanation: "Null is an object in JS." },
      { question: "Which is block-scoped?", options: ["var", "let", "global", "none"], correctAnswer: 1, explanation: "let is block-scoped." }
    ]
  }
  return Array.from({ length: count }, (_, i) => ({
    question: `What is a main part of ${topic}?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    explanation: "This is a fundamental concept."
  }))
}

const generateMockNotes = (topic) => {
  return `# Notes on ${topic}\n\n## Summary\n${topic} is very important for students...`
}

module.exports = { generateMockChatResponse, generateMockQuiz, generateMockNotes }
