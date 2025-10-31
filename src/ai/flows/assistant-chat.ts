
'use server';
/**
 * @fileOverview A conversational AI assistant flow.
 *
 * - chatWithAssistant - A function to handle conversational chat.
 * - ChatWithAssistantInput - The input type for the chat function.
 * - ChatWithAssistantOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

// Defines the structure for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']).describe("The role of the message sender, either 'user' or 'model' (the AI)."),
  content: z.string().describe("The text content of the message."),
});


const ChatWithAssistantInputSchema = z.object({
  history: z.array(MessageSchema).describe("The chat history between the user and the AI assistant."),
  language: z.enum(['en', 'mn']).describe("The language for the assistant's response."),
});
export type ChatWithAssistantInput = z.infer<typeof ChatWithAssistantInputSchema>;

const ChatWithAssistantOutputSchema = z.object({
    response: z.string().describe("The AI assistant's response to the latest user message."),
});
export type ChatWithAssistantOutput = z.infer<typeof ChatWithAssistantOutputSchema>;

export async function chatWithAssistant(input: ChatWithAssistantInput): Promise<ChatWithAssistantOutput> {
    return chatWithAssistantFlow(input);
}

const chatWithAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAssistantFlow',
    inputSchema: ChatWithAssistantInputSchema,
    outputSchema: ChatWithAssistantOutputSchema,
  },
  async ({ history, language }) => {
    if (!history || history.length === 0) {
      throw new Error("Cannot generate a response from an empty history.");
    }
    try {
        const isMongolian = language === 'mn';

        // This is the core instruction set for the AI, provided as a system prompt.
        const systemPrompt = isMongolian
          ? `Чи бол "Нома" буюу Номадли Интерн платформын хиймэл оюунт карьерын зөвлөх. Чиний цорын ганц зорилго бол Монголын оюутан, залуу мэргэжилтнүүдэд карьераа хөгжүүлэхэд нь туслах юм.

Чиний гол ур чадварууд:
- Резюме ба CV бэлтгэх: Санал хүсэлт өгөх, сайжруулах зөвлөмж өгөх, хэсгүүдийг бичихэд туслах.
- Танилцуулга захидал бичих: Бүтэц, агуулгад туслах.
- Ярилцлагад бэлтгэх: Зөвлөмж, түгээмэл асуултууд, бэлтгэл хийх хувилбарууд санал болгох.
- Карьерын замнал төлөвлөлт: Боломжит карьерын чиглэл, ур чадвар хөгжүүлэлтийн талаар ярилцах.
- Ажил хайх стратеги: Ажлыг хэрхэн үр дүнтэй хайж, өргөдөл гаргах талаар зөвлөгөө өгөх.
- Номадли Интерн платформыг ашиглах: Сайтын функцуудын талаарх асуултад хариулах.

Чи үргэлж мэргэжлийн, дэмжсэн, урам зориг өгсөн өнгө аясыг баримтлах ёстой.

**Маш чухал: Хэрэв хэрэглэгч эдгээр карьерын сэдвээс гадуур асуулт асуувал, эелдэгээр татгалзаж, яриаг эргүүлэн чиглүүлээрэй.** Жишээлбэл, "Сонирхолтой асуулт байна, гэхдээ миний мэргэжил карьерын зөвлөгөө өгөхөд төвлөрсөн. Би таны резюмег сайжруулах, ярилцлагад бэлтгэх, карьераа төлөвлөх зэрэгт тусалж чадна. Энэ талаар юу асуухыг хүсэж байна вэ?" гэж хэлж болно.

Хэрэглэгч ямар ч хэлээр харилцсан, чиний хариулт үргэлж Монгол хэлээр байх ёстойг анхаарна уу.`
          : `You are "Noma," the expert AI career coach for the Nomadly Intern platform. Your sole purpose is to assist Mongolian students and young professionals with their career development.

Your core expertise includes:
- Resume and CV building: Providing feedback, suggesting improvements, and helping write sections.
- Cover letter writing: Assisting with structure and content.
- Interview preparation: Offering tips, common questions, and practice scenarios.
- Career path planning: Discussing potential career tracks and skill development.
- Job searching strategies: Giving advice on how to find and apply for jobs effectively.
- Using the Nomadly Intern platform: Answering questions about how to use the site's features.

You must maintain a professional, supportive, and encouraging tone.

**Crucially, if a user asks a question that is unrelated to these career topics, you must politely decline to answer and guide the conversation back.** For example, you can say: "That's an interesting question, but my expertise is focused on career development. I can help you with things like improving your resume, preparing for an interview, or planning your career path. How can I assist you with those today?"

Please ensure your entire response is always in English, regardless of the user's language.`;
        
        // The user's most recent message is the last one in the history array.
        const currentTurnPrompt = history[history.length - 1].content;
        const conversationHistory = history.slice(0, -1);

        // We combine the system instructions with the latest user prompt for this turn.
        // The rest of the conversation is passed as 'history'.
        const finalPrompt = `${systemPrompt}\n\n---\n\nUser's question: ${currentTurnPrompt}`;

        const llmResponse = await ai.generate({
            model: googleAI.model('gemini-1.5-flash-latest'),
            prompt: finalPrompt,
            history: conversationHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
            config: {
              safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              ],
            },
        });

        const textResponse = llmResponse.text;
        if (!textResponse) {
          const finishReason = llmResponse.candidates[0]?.finishReason;
          if (finishReason === 'SAFETY') {
            console.error('AI response was blocked due to safety settings.');
            throw new Error("The AI's response was blocked for safety reasons. Please rephrase your message.");
          }
          throw new Error("The AI failed to generate a valid response.");
        }
        
        return { response: textResponse };
    } catch (e: any) {
        console.error("Genkit Flow Error: chatWithAssistantFlow failed.", e);
        throw new Error("AI request failed on the server. Please check the Vercel deployment logs (Functions tab) for a detailed error message. This is likely due to a missing or incorrect GOOGLE_API_KEY environment variable.");
    }
  }
);
