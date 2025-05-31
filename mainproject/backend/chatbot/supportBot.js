import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const model = new ChatOpenAI({ temperature: 0.5 });

const knowledge = JSON.parse(fs.readFileSync('knowledgeBase.json', 'utf8'));
let performance = { questionsHandled: 0 };

// Conversation memory (chat history)
let conversationHistory = [];

function logInteraction(userInput, botResponse) {
  const logs = fs.existsSync('logs.json')
    ? JSON.parse(fs.readFileSync('logs.json', 'utf-8'))
    : [];

  logs.push({
    timestamp: new Date().toISOString(),
    question: userInput,
    answer: botResponse,
  });

  fs.writeFileSync('logs.json', JSON.stringify(logs, null, 2));
}

function rewardUser(address, amount) {
  console.log(`💸 Sent ${amount} BCT tokens to ${address}! (simulated)`);
  // Future: connect this to Hardhat/ethers.js
}

async function askBot(userInput) {
  const context = `
Business Name: ${knowledge.businessName}
Products: ${knowledge.products.map(p => `${p.name} - ${p.description} (${p.price})`).join('\n')}
Return Policy: ${knowledge.policies.returns}
Shipping: ${knowledge.policies.shipping}
Contact: ${knowledge.contact.email}
  `;

  conversationHistory.push({ role: 'user', content: userInput });

  const messages = [
    {
      role: 'system',
      content: `
You are a customer support bot who helps ${knowledge.businessName}.
Use the provided business context to help the user.
Stay very polite, nice, concise, and conversational.
Here is the context:
${context}
      `.trim()
    },
    ...conversationHistory
  ];

  const response = await model.invoke(messages);
  const answer = response.content.trim();

  console.log(answer);
  conversationHistory.push({ role: 'assistant', content: answer });

  performance.questionsHandled++;
  fs.writeFileSync('performance.json', JSON.stringify(performance, null, 2));
  logInteraction(userInput, answer);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`Welcome to ${knowledge.businessName} Support Bot!`);
console.log(`Type your question below (type 'exit' to end the chat):`);

rl.on('line', async (input) => {
  if (input.toLowerCase() === 'exit') {
    rl.question("Before you go, was this support helpful? (yes/no): ", (feedback) => {
      if (feedback.toLowerCase() === "yes") {
        const userWallet = "0x123...abc";
        rewardUser(userWallet, 10);
      }
      console.log(`Goodbye! Thanks for chatting with ${knowledge.businessName} Support Bot!`);
      rl.close();
    });
    return;
  }

  await askBot(input);
  rl.prompt();
});

rl.prompt();
