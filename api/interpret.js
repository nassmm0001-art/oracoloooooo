export default async function handler(req, res) {
    // 1. Check Method
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "MUST_USE_POST" });
    }

    const { question, symbols } = req.body;

    // 2. Check for API Key
    if (!process.env.CLAUDE_KEY) {
        console.error("CRITICAL: CLAUDE_KEY is missing from Vercel Environment Variables.");
        return res.status(500).json({ error: "SERVER_CONFIG_ERROR", details: "API Key not found on server." });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.CLAUDE_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-latest",
                max_tokens: 1500,
                temperature: 0.8,
                system: "You are the Sovereign's Shadow. Your logic is surgical, willful, and grounded. Return ONLY a JSON array. No preamble, no chat.",
                messages: [{
                    role: "user",
                    content: `INQUIRY: "${question}" | SIGNALS: [${symbols.join(', ')}]
                    TASK: Return 7 objects in a JSON array. 
                    FORMAT: [{"pattern": "title", "reading": "logic", "action": "command"}]`
                }]
            })
        });

        const data = await response.json();

        // 3. Handle Anthropic-specific errors (like 402 no money)
        if (data.error) {
            console.error("ANTHROPIC_ERROR:", data.error);
            return res.status(response.status).json({ error: data.error.type, message: data.error.message });
        }

        const rawText = data.content[0].text;
        
        // 4. Surgical JSON extraction (removes AI's conversational fluff if it exists)
        const jsonStart = rawText.indexOf('[');
        const jsonEnd = rawText.lastIndexOf(']') + 1;
        const jsonString = rawText.substring(jsonStart, jsonEnd);

        res.status(200).json(JSON.parse(jsonString));

    } catch (err) {
        console.error("BRIDGE_CRASHED:", err.message);
        res.status(500).json({ error: "INTERNAL_BRIDGE_COLLAPSE", details: err.message });
    }
}
