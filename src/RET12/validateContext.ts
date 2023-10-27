
import { isValidTimestamp } from "../common";
import cityToPincodeMapping from "../common/cityToPincodeMapping";
import { doesNotContainHttpsOrWww } from "../common/helper";

/**
 * INFO: Validate each key from input json context
 * @param context 
 * @returns { message: string, key: string }[]
 */
export const validateContext = (context: any) => {
    let errors: { message: string, key: string }[] = [];
    const { domain, action, country, city, core_version, bap_id, bap_uri, transaction_id, message_id, timestamp, ttl, bpp_id, bpp_uri } = context;
    if (domain != 'ONDC:RET12') {
        errors.push({ message: '➡️♠️ Domain should be - ONDC:RET12 in context', key: 'context_domain' });
    }
    if (action != 'on_search') {
        errors.push({ message: "➡️♠️ Only 'on_search' action is acceptable in context", key: 'context_action' });
    }
    if (country != 'IND') {
        errors.push({ message: "➡️♠️ Country should be - IND only in context", key: 'context_country' });
    }
    if (!city) {
        errors.push({ message: "➡️♠️ Missing mendatory field - City in context", key: 'context_city' });
    } else {
        const stdData = city.split(':');
        if (stdData.length != 2) errors.push({ message: "➡️♠️ City format should be std:XXX in context", key: 'context_city' });
        else {
            if (stdData[0] != 'std') errors.push({ message: "➡️♠️ City prefix should be 'std' in context", key: 'context_city' });
            if (!cityToPincodeMapping.some(item => item["STD Code"] === stdData[1])) errors.push({ message: "➡️♠️ City stdcode is not valid in context", key: 'context_city' });
        }
    }
    if (!core_version) {
        errors.push({ message: "➡️♠️ core_version should be - 1.2.0 only in context", key: 'context_core_version' });
    }
    if (!bap_id || typeof bap_id != 'string') {
        errors.push({ message: "➡️♠️ Missing mendatory field - bap_id in context", key: 'context_bap_id' });
    }
    if (!doesNotContainHttpsOrWww(bap_id)) {
        errors.push({ message: "➡️♠️ bap_id shouldn't have https or www in context", key: 'context_bap_id' });
    }
    if (!bap_uri || typeof bap_uri != 'string') {
        errors.push({ message: "➡️♠️ Missing mendatory field - bap_uri in context", key: 'context_bap_uri' });
    }
    if (!bap_uri.includes('https')) {
        errors.push({ message: "➡️♠️ https should be included in context bap_uri", key: 'context_bap_uri' });
    }
    if (!bpp_id || typeof bpp_id != 'string') {
        errors.push({ message: "➡️♠️ Missing mendatory field - bpp_id in context", key: 'context_bpp_id' });
    }
    if (!doesNotContainHttpsOrWww(bpp_id)) {
        errors.push({ message: "➡️♠️ bpp_id shouldn't have https or www in context", key: 'context_bpp_id' });
    }
    if (!bpp_uri || typeof bpp_uri != 'string') {
        errors.push({ message: "➡️♠️ Missing mendatory field - bpp_uri in context", key: 'context_bpp_uri' });
    }
    if (!bpp_uri.includes('https')) {
        errors.push({ message: "➡️♠️ Https should be included in context bpp_uri", key: 'context_bpp_uri' });
    }
    if (!timestamp || !isValidTimestamp(timestamp)) {
        errors.push({ message: "➡️♠️ Timestamp should be valid in context", key: 'context_timestamp' });
    }
    return errors;
};