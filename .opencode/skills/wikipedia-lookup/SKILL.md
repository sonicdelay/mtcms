---
name: wikipedia-lookup
description: Retrieves summarized information about a specific topic directly from Wikipedia. Use this skill when the user asks for factual knowledge that might be too general or outdated in the model's training data (e.g., 'What is quantum entanglement?').
---

## What I do

- Fetches Wikipedia article summaries for a given topic
- Returns concise, factual information from Wikipedia's API
- Provides links for further reading

## When to use me

Use this skill when the user asks for factual or encyclopedic knowledge — especially for topics that may be too recent, too niche, or too detailed for the model's training data. Ideal for questions like "What is X?" or "Explain Y".

## Usage

Call the Wikipedia API endpoint:

```
https://en.wikipedia.org/api/rest_v1/page/summary/{topic}
```

The response includes `title`, `extract` (plain text summary), `pageId`, and `content_urls` for further reading.

## Example

```python
import requests
resp = requests.get(
    "https://en.wikipedia.org/api/rest_v1/page/summary/Quantum_entanglement"
)
data = resp.json()
print(data["extract"])
```
