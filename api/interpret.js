export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "USE_POST" });

    const { question, symbols } = req.body;

    // Verify key exists in Vercel Environment Variables
    if (!process.env.CLAUDE_KEY) {
        return res.status(500).json({ error: "MISSING_KEY", message: "Add CLAUDE_KEY to Vercel." });
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
                model: "claude-sonnet-4-6", // UPGDATED TO 2026 STANDARD
                max_tokens: 2000,
                temperature: 0.8,
                system: "You are the Sovereign's Shadow. Return ONLY a raw JSON array of 7 distinct interpretations. No intro text.",
                messages: [{
                    role: "user",
                    content: `INQUIRY: "${question}" | SIGNALS: [${symbols.join(', ')}]
                    FORMAT: [{"pattern": "title", "reading": "logic", "action": "command"}]`
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(response.status).json({ error: "API_ERROR", message: data.error.message });
        }

        // Surgical JSON Extraction
        const rawText = data.content[0].text;
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        const finalData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

        res.status(200).json(finalData);
    } catch (err) {
        res.status(500).json({ error: "BRIDGE_COLLAPSE", details: err.message });
    }
}
