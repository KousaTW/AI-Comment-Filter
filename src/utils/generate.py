import re
from groq import Groq
from utils.prompt import SYSTEM_PROMPT

def filter_comments(inputs, api_key):
    client = Groq(api_key=api_key)
    model_id = "gemma2-9b-it"
    
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": inputs,
            }
        ],
        model=model_id,
    )
    outputs = chat_completion.choices[0].message.content

    pattern = re.compile(r'(<filtered_Comments>.*?</filtered_Comments>)', re.DOTALL)
    match = pattern.findall(outputs)
    if not match:
        result = "<filtered_Comments></filtered_Comments>"
    else:
        result = match[0]

    pattern = re.compile(r'>\s+<')
    result = pattern.sub('><', result)
    return result
