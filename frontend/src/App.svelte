<script>
  let messages = [];
  let input = '';
  let loading = false;

  async function sendMessage() {
    if (!input.trim()) return;

    messages = [...messages, { from: 'user', text: input }];
    loading = true;

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response from server');
      }

      const data = await res.json();
      messages = [...messages, { from: 'bot', text: data.response }];
    } catch (error) {
      messages = [...messages, { from: 'bot', text: 'Error: ' + error.message }];
    } finally {
      loading = false;
      input = '';
    }
  }
</script>
