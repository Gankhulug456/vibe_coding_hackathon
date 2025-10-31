
// 'use server';
/**
 * @fileOverview Provides functionality to analyze a resume and provide feedback.
 *
 * - analyzeResume - Analyzes the resume and returns feedback.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.enum(['en', 'mn']).describe("The language for the analysis output (e.g., 'en' for English, 'mn' for Mongolian)."),
});

export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  clarityScore: z.number().describe('A score (0-100) indicating the clarity, readability, and ease of understanding of the resume. Higher scores mean better clarity.'),
  keywordScore: z.number().describe('A score (0-100) indicating how well the resume is optimized with relevant keywords for common roles or Applicant Tracking Systems (ATS). Higher scores mean better keyword usage.'),
  suggestions: z.array(z.string()).describe('A list of specific, actionable suggestions for improving the resume, with rationale for each. These suggestions should be plain text without Markdown formatting for emphasis or headings.'),
});

export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const resumeAnalysisPrompt = ai.definePrompt({
  name: 'resumeAnalysisPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are an expert resume analysis AI. Your task is to critically evaluate the provided resume and generate a detailed, objective report. You must not use placeholder values; all scores and suggestions must be derived directly and logically from the content of the resume.

Your entire response, including all scores and suggestions, must be in the language specified by the following language code: {{language}}.
If the language code is 'mn', your response must be entirely in Mongolian.
If the language code is 'en', your response must be entirely in English.
Adhere strictly to this language requirement.

Analyze the resume provided below based on the following criteria. Base your scores solely on the document provided.

1.  **Clarity Score (0-100):** Evaluate this score based on factors such as:
    *   Readability: Is the language clear, concise, and free of jargon?
    *   Structure & Formatting: Is the layout professional, consistent, and easy to scan?
    *   Information Hierarchy: Is the most important information easy to find?
    *   Grammar & Spelling: Are there minimal to no errors?
    A high score (e.g., 85-100) indicates excellent clarity and professionalism. A low score (e.g., below 60) suggests significant issues.
    **Derive this score directly from the resume's text, formatting, and structure.**

2.  **Keyword Score (0-100):** Evaluate this score based on:
    *   Relevance to Common Roles: Does the resume incorporate keywords (skills, technologies) typically associated with roles the candidate might be targeting?
    *   ATS Friendliness: Are keywords naturally integrated? Is the formatting compatible with common ATS parsing?
    *   Industry-Specific Terminology: Is appropriate industry language used effectively?
    A high score (e.g., 85-100) means the resume is well-optimized. A low score (e.g., below 60) suggests a lack of optimization.
    **Derive this score by analyzing the skills, job titles, and descriptions present in the resume.**

3.  **Detailed Suggestions for Improvement:** Provide a list of specific, actionable suggestions. For each suggestion, briefly explain the rationale. Cover areas like:
    *   Structure and Formatting: Comments on layout, font choice, spacing.
    *   Content & Impact: Suggest quantifying achievements with numbers, using strong action verbs, and focusing on results over duties.
    *   Clarity and Conciseness: Identify jargon, run-on sentences, or dense paragraphs.
    *   Keyword Optimization: Mention any missing industry-specific keywords for likely roles.
    *   Grammar and Spelling: Note any significant errors.
    **Base these suggestions directly on weaknesses you identify in the resume.**

IMPORTANT: All suggestions must be provided as plain text. Do NOT use Markdown formatting (like **bold** or *italic* or ## headings).

The resume is provided as a data URI:
{{media url=resumeDataUri}}`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async input => {
    const {output} = await resumeAnalysisPrompt(input);
    return output!;
  }
);
