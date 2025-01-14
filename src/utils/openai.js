export async function generateMessage(resume, apiKey, type, positionLink = '') {
  try {
    let prompt;
    if (type === 'referral') {
      prompt = `Given this resume:\n${resume}\n\nAnd this job posting: ${positionLink}\n\nWrite a professional LinkedIn message requesting a referral. Keep it concise, friendly, and highlight relevant experience.`;
    } else {
      prompt = `Given this resume:\n${resume}\n\nWrite a professional LinkedIn message requesting a brief zoom call to learn more about their experience and potential opportunities. Keep it concise and friendly.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating message:', error);
    throw error;
  }
}
