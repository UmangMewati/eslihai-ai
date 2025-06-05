export async function getAIResponse(message) {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await res.json();
    return data.reply;  // matches Flask response JSON { "reply": "..." }
  } catch (error) {
    console.error('Error in sendMessageToBackend:', error);
    return "Sorry, something went wrong.";
  }
}
