
'use server';
/**
 * @fileOverview Provides AI functionality for the resume builder feature.
 * - extractResumeInfo: Extracts structured data from a resume PDF.
 * - improveResumeSection: Improves a specific section of resume text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

// Input schema for extracting resume info from a PDF
const ExtractResumeInfoInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A PDF file of a resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  language: z.enum(['en', 'mn']).describe("The target language for the extracted content."),
});
export type ExtractResumeInfoInput = z.infer<typeof ExtractResumeInfoInputSchema>;

// Output schema for the structured resume data
const ResumeDataSchema = z.object({
  contact: z.object({
    name: z.string().describe("The full name of the person."),
    email: z.string().describe("The email address."),
    phone: z.string().describe("The phone number."),
    address: z.string().describe("The physical or mailing address."),
    linkedin: z.string().optional().describe("The URL of the LinkedIn profile."),
  }).describe("Contact information section."),
  summary: z.string().describe("A professional summary or objective statement."),
  experience: z.array(z.object({
    id: z.string().describe("A unique identifier for this experience entry, like a UUID."),
    jobTitle: z.string().describe("The job title or position."),
    company: z.string().describe("The name of the company or organization."),
    startDate: z.string().describe("The start date of the employment (e.g., 'YYYY-MM')."),
    endDate: z.string().describe("The end date of the employment (e.g., 'YYYY-MM' or 'Present')."),
    description: z.string().describe("A description of responsibilities and achievements, formatted with bullet points using '-'.")
  })).describe("A list of work experiences."),
  education: z.array(z.object({
    id: z.string().describe("A unique identifier for this education entry, like a UUID."),
    school: z.string().describe("The name of the school or university."),
    degree: z.string().describe("The degree or field of study."),
    startDate: z.string().describe("The start date of the education (e.g., 'YYYY-MM')."),
    endDate: z.string().describe("The end date or graduation date (e.g., 'YYYY-MM')."),
  })).describe("A list of educational qualifications."),
  skills: z.array(z.string()).describe("A list of skills."),
  languages: z.array(z.string()).optional().describe("A list of languages the person speaks."),
  projects: z.array(z.object({
    id: z.string().describe("A unique identifier for this project entry, like a UUID."),
    title: z.string().describe("The title of the project."),
    description: z.string().describe("A description of the project, formatted with bullet points using '-'.")
  })).optional().describe("A list of personal or academic projects."),
  awards: z.array(z.object({
      id: z.string().describe("A unique identifier for this award entry, like a UUID."),
      title: z.string().describe("The name of the award or honor."),
      date: z.string().describe("The date the award was received (e.g., 'YYYY-MM').")
  })).optional().describe("A list of awards or honors."),
  activities: z.array(z.object({
      id: z.string().describe("A unique identifier for this activity entry, like a UUID."),
      title: z.string().describe("The name of the extracurricular activity or organization."),
      description: z.string().describe("A description of your role or involvement, formatted with bullet points using '-'.")
  })).optional().describe("A list of extracurricular activities or volunteer work.")
}).describe("The structured data extracted from the resume.");
export type ResumeData = z.infer<typeof ResumeDataSchema>;


// The main exported function for the frontend to call
export async function extractResumeInfo(input: ExtractResumeInfoInput): Promise<ResumeData> {
  return extractResumeInfoFlow(input);
}

// The prompt for extracting structured data from a resume
const extractResumePrompt = ai.definePrompt({
  name: 'extractResumePrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: { schema: ExtractResumeInfoInputSchema },
  output: { schema: ResumeDataSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert resume parser. Your ONLY task is to extract structured information from the provided resume PDF into the specified JSON schema.

**Critical Rules:**
1.  **Source of Truth:** The provided resume PDF is your ONLY source of information. Do not invent, infer, or hallucinate any data.
2.  **Empty Fields:** If you cannot find information for a specific text field (like a summary, address, or description), you MUST return an empty string (\`""\`). **DO NOT under any circumstances output the literal word "string".**
3.  **Empty Sections:** If an entire section (like 'projects', 'awards', or 'activities') is missing from the resume, you MUST return an empty array (\`[]\`) for that section. Do not create placeholder entries.
4.  **Schema Adherence:** Follow the JSON output schema precisely. The "describe" fields in the schema are your instructions, not values to be returned.
5.  **Language:** All extracted text must be in the specified language code: {{language}}.
6.  **Unique IDs:** For every entry in a list (experience, education, etc.), you MUST generate a unique UUID for its 'id' field.
7.  **Formatting:** Format all 'description' fields with bullet points starting with a hyphen '-'.

Resume PDF to analyze:
{{media url=resumeDataUri}}`,
});

// The flow that orchestrates the extraction process
const extractResumeInfoFlow = ai.defineFlow(
  {
    name: 'extractResumeInfoFlow',
    inputSchema: ExtractResumeInfoInputSchema,
    outputSchema: ResumeDataSchema,
  },
  async (input) => {
    try {
      const { output } = await extractResumePrompt(input);
      if (!output) {
          throw new Error("Failed to extract information from the resume.");
      }
      return output;
    } catch(e: any) {
        console.error("Genkit Flow Error: extractResumeInfoFlow failed.", e);
        throw new Error("AI request failed on the server. Please check the Vercel deployment logs (Functions tab) for a detailed error message. This is likely due to a missing or incorrect GOOGLE_API_KEY environment variable.");
    }
  }
);


// --- AI Text Improvement Flow ---

// Input schema for improving a section of text
const ImproveResumeSectionInputSchema = z.object({
  textToImprove: z.string().describe("The text from a resume section (e.g., a job description) that needs improvement."),
  language: z.enum(['en', 'mn']).describe("The language for the improved text."),
});
export type ImproveResumeSectionInput = z.infer<typeof ImproveResumeSectionInputSchema>;

// Output schema for the improved text
const ImproveResumeSectionOutputSchema = z.object({
  improvedText: z.string().describe("The AI-improved version of the text, ready to be used in the resume. Should be formatted with bullet points using '-'.")
});
export type ImproveResumeSectionOutput = z.infer<typeof ImproveResumeSectionOutputSchema>;

// The main exported function for the frontend
export async function improveResumeSection(input: ImproveResumeSectionInput): Promise<ImproveResumeSectionOutput> {
  return improveResumeSectionFlow(input);
}

// The prompt for improving text
const improveTextPrompt = ai.definePrompt({
    name: 'improveResumeTextPrompt',
    model: googleAI.model('gemini-1.5-flash-latest'),
    input: { schema: ImproveResumeSectionInputSchema },
    output: { schema: ImproveResumeSectionOutputSchema },
    config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    },
    prompt: `You are an expert career coach. Rewrite the following resume section to be more professional, impactful, and action-oriented.
Use strong action verbs and quantify achievements where possible. The response must be in the specified language: {{language}}.
Format the output with bullet points starting with a hyphen '-'.

Original text:
"{{textToImprove}}"
`
});

// The flow that orchestrates the text improvement
const improveResumeSectionFlow = ai.defineFlow({
    name: 'improveResumeSectionFlow',
    inputSchema: ImproveResumeSectionInputSchema,
    outputSchema: ImproveResumeSectionOutputSchema,
}, async (input) => {
    try {
      const { output } = await improveTextPrompt(input);
      if (!output) {
          throw new Error("AI failed to generate an improved version.");
      }
      return output;
    } catch(e: any) {
        console.error("Genkit Flow Error: improveResumeSectionFlow failed.", e);
        throw new Error("AI request failed on the server. Please check the Vercel deployment logs (Functions tab) for a detailed error message. This is likely due to a missing or incorrect GOOGLE_API_KEY environment variable.");
    }
});
