
import { validateMessage } from "./validateMessage";
import { validateContext } from "./validateContext";
import { getRetailsOnConfirm } from "./fileManager";

/**
 * INFO: Validate On Status JSON data for products - (2. For other product)
 * @param data 
 * @param order_id 
 * @param order_state 
 * @returns { message: string, key: string }[]
 */
export const validateInput = async (data: any, file_state: string): Promise<{ message: string; key: string; }[]> => {
    const { context, message } = data;
    let errors: { message: string, key: string }[] = [];
    if (!context) {
        errors.push({ message: '➡️♠️ Missing required field - Context', key: 'context' });
    }
    if (!message) {
        errors.push({ message: '➡️♠️ Missing required field - Message', key: 'message' });
    }
    const confirmJSON = getRetailsOnConfirm();
    if (confirmJSON) {
        const contextError = validateContext(context, confirmJSON.context, file_state);
        if (contextError?.length) errors = [...errors, ...contextError]

        const messageError = await validateMessage(message, context?.timestamp, confirmJSON.message);
        if (messageError?.length) errors = [...errors, ...messageError]
    } else {
        errors.push({ message: '➡️♠️ Missing required file - on_confirm.json to take order input', key: 'on_confirm_json_file' });
    }


    return errors;
};
