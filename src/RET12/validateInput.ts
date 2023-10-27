import { validateMessage } from "./validateMessage";
import { validateContext } from "./validateContext";

/**
 * INFO: Validate RET12 JSON data
 * @param data 
 * @returns { message: string, key: string }[]
 */
export const validateInput = async (data: any) => {
    const { context, message } = data;
    let errors: { message: string, key: string }[] = [];
    if (!context) {
        errors.push({ message: '➡️♠️ Missing required field - Context', key: 'context' });
    }
    if (!message) {
        errors.push({ message: '➡️♠️ Missing required field - Message', key: 'message' });
    }

    const contextError = validateContext(context);
    if (contextError?.length) errors = [...errors, ...contextError]

    const messageError = await validateMessage(message, context?.timestamp);
    if (messageError?.length) errors = [...errors, ...messageError]
    return errors;
};