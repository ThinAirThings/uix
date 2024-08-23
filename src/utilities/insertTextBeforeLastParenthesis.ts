export const insertTextBeforeLastParenthesis = (input: string, insertText: string)=> {
    const lastIndex = input.lastIndexOf(')');
    if (lastIndex === -1) return input; // If no closing parenthesis is found, return the original string
    return input.slice(0, lastIndex) + ` ${insertText}` + input.slice(lastIndex);
}