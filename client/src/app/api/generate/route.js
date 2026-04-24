import { NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';
import { YoutubeTranscript } from 'youtube-transcript';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// A helper to generate strict JSON using Mistral
async function generateJSON(prompt, systemInstruction, model = "mistral-large-latest") {
  const completion = await mistral.chat.complete({
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    model: model,
    temperature: 0.3,
    responseFormat: { type: "json_object" }
  });
  return JSON.parse(completion.choices[0].message.content);
}

// Helper to convert array buffer to base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const sourceMode = formData.get('sourceMode');
    const difficulty = formData.get('difficulty');
    const questionCount = parseInt(formData.get('questionCount')) || 10;
    const topic = formData.get('topic');
    const customPrompt = formData.get('prompt') || '';
    const youtubeUrl = formData.get('youtubeUrl');
    const file = formData.get('file');

    let contextData = '';

    // 1. Gather Context
    if (sourceMode === 'topic') {
      contextData = `Topic: ${topic}. ${customPrompt ? `Additional Instructions: ${customPrompt}` : ''}`;
    } 
    else if (sourceMode === 'youtube') {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
        contextData = transcript.map(t => t.text).join(' ');
        // Truncate to avoid massive token counts if necessary:
        if (contextData.length > 18000) contextData = contextData.substring(0, 18000);
      } catch (err) {
        return NextResponse.json({ error: 'Could not extract transcript from YouTube URL. Make sure the video has captions.' }, { status: 400 });
      }
    } 
    else if (sourceMode === 'upload' && file) {
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        // Dynamically require pdf-parse to bypass Next.js Webpack crashing on pdfjs-dist ESM payload
        const pdfParseDynamic = eval('require')('pdf-parse/lib/pdf-parse.js');
        const pdfData = await pdfParseDynamic(Buffer.from(buffer));
        contextData = pdfData.text;
        if (contextData.length > 18000) contextData = contextData.substring(0, 18000);
      } 
      else if (file.type.startsWith('image/')) {
        // Use Mistral Vision model to extract text/summary from image first
        const buffer = await file.arrayBuffer();
        const base64Image = arrayBufferToBase64(buffer);
        
        const visionResponse = await mistral.chat.complete({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Extract the core concepts, topics, and relevant text from this image to use as context for creating a quiz." },
                { type: "image_url", imageUrl: `data:${file.type};base64,${base64Image}` } // Note: Mistral SDK uses imageUrl
              ]
            }
          ],
          model: "pixtral-12b-2409",
          temperature: 0.1,
        });
        contextData = visionResponse.choices[0].message.content;
      } 
      else if (file.type === 'text/plain') {
        contextData = await file.text();
        if (contextData.length > 18000) contextData = contextData.substring(0, 18000);
      }
      else {
        return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
      }
    } 
    else {
      return NextResponse.json({ error: 'Missing necessary source data.' }, { status: 400 });
    }

    // 2. Build Groq AI Prompt for generating exact JSON
    const systemPrompt = `You are a world-class educational AI exam generator. You must output the result strictly in JSON.
Format required:
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here...",
      "difficulty": "Easy/Medium/Hard",
      "topic": "Main topic word",
      "type": "MCQ",
      "options": [
        { "id": "a", "text": "Option A text" },
        { "id": "b", "text": "Option B text" },
        { "id": "c", "text": "Option C text" },
        { "id": "d", "text": "Option D text" }
      ],
      "correct": "b"
    }
  ]
}
Make sure 'correct' exactly matches the ID of the correct option ('a', 'b', 'c', or 'd').`;

    const userPrompt = `
Based on the following source data, generate exactly ${questionCount} multiple-choice questions (make sure type is "MCQ").
The requested difficulty level is: ${difficulty}.
${customPrompt ? `Important Instructor Notes: ${customPrompt}` : ''}

Source Data Context:
${contextData}

Generate ${questionCount} high-quality questions spanning the context. Try to avoid repetition. Output ONLY JSON.`;

    // 3. Call Mistral
    const result = await generateJSON(userPrompt, systemPrompt);

    // Give IDs just in case they are missing or misnumbered
    const preparedQuestions = (result.questions || []).map((q, i) => ({
      ...q,
      id: Date.now() + i
    }));

    return NextResponse.json({ questions: preparedQuestions });
  } catch (error) {
    console.error('Groq Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 });
  }
}
