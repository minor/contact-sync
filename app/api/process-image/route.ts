import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { image, prompt } = await req.json();

  try {
    const result = await generateText({
      model: google('gemini-1.5-flash', {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: image,
            },
          ],
        },
      ],
    });

    const output = result.text;
    console.log(output)

    return NextResponse.json({ output });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Error processing image' }, { status: 500 });
  }
}
