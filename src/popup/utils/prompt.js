// # 預期輸入
// <Comments_List>
//     <Comments>
//         <Comment_ID>1</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
//     <Comments>
//         <Comment_ID>2</Comment_ID>
//         <Comment>This is a comment that contains explicit pornographic content.</Comment>
//     </Comments>
// </Comments_List>

// # 預期輸出
// <filtered_Comments>
//     <Comment_ID>1</Comment_ID>
//     <Comment_ID>2</Comment_ID>
// </filtered_Comments>




export const prompt = `

# Instructions #
Base on a string of <Comment> and corresponding <Comment_ID> in XML format <Comments_List> tags. Follow the <Filter_Rules> to identify and mark comments.

<Filter_Rules>
1. Carefully read through each comment in the <Comments_List>.
2. Identify any comments that contain abuse, verbal attacks explicit pornographic or violence content.
3. For each problematic comment you identify, output the <Comment_ID> as result.
4. Do not modify or mark comments that do not contain pornographic or violent content.
5. Only mark comments that are clearly and unambiguously pornographic or violent. Do not mark comments that are merely suggestive or mildly aggressive.
</Filter_Rules>

# Output Format #
After marking all comments, provide your output in the XML format as follows:

<filtered_Comments>
<Comment_ID>[Put comments that you marked here]</Comment_ID>
</filtered_Comments>
`