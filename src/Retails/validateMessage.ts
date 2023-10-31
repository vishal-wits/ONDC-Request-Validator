import { isValidTimestamp } from "../common";
import orderState from "./constant/orderState";


/**
 * INFO: Verify json message object
 * @param message 
 * @param contextTimestamp 
 * @param order_id 
 * @param order_state 
 * @returns { message: string, key: string }[]
 */
export const validateMessage = async (message: any, contextTimestamp: string, confirm_message: any): Promise<{ message: string; key: string; }[]> => {
    const { order } = message;
    let errors: { message: string, key: string }[] = [];
    if (!order || typeof order !== 'object') {
        errors.push({ message: '➡️♠️ Missing required field in message - order', key: `message_order` });
        return errors;
    } else {
        validateOrder(errors, order, contextTimestamp, confirm_message);
    }

    return errors;
};

/**
 * INFO: Validate message order
 * @param errors 
 * @param payload 
 */
const validateOrder = (errors: any[], payload: any, contextTimestamp: string, confirm_message: any) => {
    const { id, state, cancellation, provider, items, billing, fulfillments, quote, payment, documents, created_at, updated_at } = payload;
    const { order } = confirm_message;
    // id
    if (!id || typeof id !== 'string') {
        errors.push({ message: `➡️♠️ Missing required field - id in message > order`, key: `message_order_id` });
    } else if (id !== order['id']) {
        errors.push({ message: `➡️♠️ Order id should be valid and it should be from on_confirm order in message > order`, key: `message_order_id` });
    }
    // state
    if (!state || typeof state !== 'string') {
        errors.push({ message: `➡️♠️ Missing required field - state in message > order`, key: `message_order_state` });
    } else if (!orderState.includes(state)) {
        errors.push({ message: `➡️♠️ State is not valid in message, it should be ${orderState.join(', ')} > order`, key: `message_order_state` });
    }
    // cancellation
    if (state === 'Cancelled' && (!cancellation || typeof cancellation !== 'object')) {
        errors.push({ message: `➡️♠️ Missing required field - cancellation in message > order`, key: `message_order_cancellation` });
    } else {

    }
    // provider
    if (!provider || typeof provider !== 'object') {
        errors.push({ message: `➡️♠️ Missing required field - provider in message > order`, key: `message_order_provider` });
    } else {

    }
    // items
    if (!items || !Array.isArray(items) || !items?.length) {
        errors.push({ message: `➡️♠️ Missing required field - items in message > order`, key: `message_order_items` });
    } else {

    }
    // billing
    if (!billing || typeof billing !== 'object') {
        errors.push({ message: `➡️♠️ Missing required field - billing in message > order`, key: `message_order_billing` });
    } else {

    }
    // fulfillments
    if (!fulfillments || !Array.isArray(fulfillments) || !fulfillments?.length) {
        errors.push({ message: `➡️♠️ Missing required field - fulfillments in message > order`, key: `message_order_fulfillments` });
    } else {

    }
    // quote
    if (!quote || typeof quote !== 'object') {
        errors.push({ message: `➡️♠️ Missing required field - quote in message > order`, key: `message_order_quote` });
    } else {

    }
    // payment
    if (!payment || typeof payment !== 'object') {
        errors.push({ message: `➡️♠️ Missing required field - payment in message > order`, key: `message_order_payment` });
    } else {

    }
    // // documents
    // if (!documents || !Array.isArray(documents) || !documents?.length) {
    //     errors.push({ message: `➡️♠️ Missing required field - documents in message > order`, key: `message_order_documents` });
    // } else {

    // }
    // created_at
    if (!created_at || !isValidTimestamp(created_at)) {
        errors.push({ message: "➡️♠️ Created date should be valid in message > order", key: 'message_order_created_at' });
    }
    // updated_at
    if (!updated_at || !isValidTimestamp(updated_at)) {
        errors.push({ message: "➡️♠️ Updated date should be valid in message > order", key: 'message_order_updated_at' });
    }

}

