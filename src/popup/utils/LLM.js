/**
 * @param {string} apiKey
 * @param {string} user_prompt
 * @param {string} model
 * @returns {string} 
 */
export async function modelGenerate(apiKey, user_prompt, model) {
    try{
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: user_prompt }],
                model: model
            })
        });

        const data = await response.json();
        return data['choices'][0]['message']['content'];
    }catch(error) {
        console.error("LLM Error:", error);
        return "Generation Failed.";
    }
}


/**
 * @param {Array<Object>} data
 * @param {string} outerTag
 * @param {string} innerTag
 * @returns {string} 
 */
export function convertListToXML(data, outerTag, innerTag) {
    function dictToXML(dict) {
        let xml = '';
        for (const [key, value] of Object.entries(dict)) {
            xml += `<${key}>${value}</${key}>\n`;
        }
        return xml;
    }

    let xml = `<${outerTag}>`;
    data.forEach(item => {
        xml += `<${innerTag}>`;
        xml += dictToXML(item);
        xml += `</${innerTag}>`;
    });
    xml += `</${outerTag}>`;
    return xml;
}
// Input:
// [{"Comment_ID": "@user1_1-1", "Comment": "This is a comment that contains explicit pornographic content."}]
// # Output:
// <Comments_List>
//     <Comments>
//         <Comment_ID>@user1_1-1</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
// </Comments_List>


export function test(){
    console.log("TEST import");
}