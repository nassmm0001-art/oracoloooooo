export default async function handler(req, res) {
    const { question, symbols } = req.body;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.CLAUDE_KEY, // Set this in Vercel
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-latest",
                max_tokens: 1500,
                temperature: 0.8,
                system: `You are the Sovereign's Shadow—a high-level occult strategist for CEOs, Kings, and Power Players. 
                Your task is to take noisy, random symbols and perform a surgical synthesis. 
                
                LOGIC PROTOCOLS:
                - TRIANGULATION: Identify the conflict between symbols as 'Structural Friction' or 'Sabotage'.
                - SILENT VARIABLE: Address the thing the user ISN'T asking about, but is the root of the noise.
                - MATERIAL MASTERY: Every spiritual insight MUST have a material, actionable, and tactical counterpart.
                - WILLFULNESS: Use 'This is' and 'Do this'. Absolute authority only. No 'perhaps' or 'maybe'.`,
                messages: [{
                    role: "user",
                    content: `INQUIRY: "${question || 'General Strategic Alignment'}"
                    SIGNALS: [${symbols.join(', ')}]
                    
                    Return ONLY a JSON array of 7 objects. 
                    Format: {"pattern": "4-word title", "reading": "Surgical synthesis of the noise", "action": "One ruthless tactical command"}`
                }]
            })
        });

        const data = await response.json();
        let content = data.content[0].text;
        
        // Sanitize JSON if Claude adds markdown blocks
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
        }

        res.status(200).json(JSON.parse(content.trim()));
    } catch (error) {
        res.status(500).json({ error: "NEURAL_LINK_STALLED", details: error.message });
    }
}