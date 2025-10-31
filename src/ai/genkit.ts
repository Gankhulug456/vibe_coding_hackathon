
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Add a check for the API key to provide a clear error message.
if (!process.env.GOOGLE_API_KEY) {
  throw new Error(
    'GOOGLE_API_KEY environment variable not set. ' +
    'Please create a .env file and add GOOGLE_API_KEY=<your_api_key>. ' +
    'You can get an API key from Google AI Studio.'
  );
}


export const ai = genkit({
  plugins: [googleAI()],
});
