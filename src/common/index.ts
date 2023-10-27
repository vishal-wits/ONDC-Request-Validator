
export const fulfillmentsType = [
    'Delivery',
    'Self-Pickup',
    'Delivery and Self-Pickup'
]

export const timeLabel = [
    'enable',
    'disable',
    // 'close'
]

export const distanceUnit = [
    'km',
]

export const tagsCode = [
    'type',
    'attr',
]
export const tagsListCode = [
    'type',
    'name',
    'seq'
]
export const counrtyCode = [
    'IND',
]
export const ItemTagsCode = [
    'origin',
    'attribute',
]



export const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const minYear = 1970;
    const year = date.getUTCFullYear();
    if (year < minYear) return false;
    return true;
}

export const isValidTimestamp = (timestamp: string): boolean => {
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!timestampPattern.test(timestamp)) {
        return false;
    }
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return false;
    const minYear = 1970;
    const year = date.getUTCFullYear();
    if (year < minYear) return false;
    return true;
}

export const isPhoneNumberValid = (phoneNumber: string): boolean => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const validLength = 10;
    return digitsOnly.length === validLength;
}

export const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
}

export const isValidDateFormat = (input: string): boolean => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    return datePattern.test(input);
}

export const isValidTimeFormat = (time: string): boolean => {
    const timePattern = /^(0[0-9]|1[0-9]|2[0-3])[0-5][0-9]$/;
    return timePattern.test(time);
}

export const isValidNumber = (str: string): boolean => {
    const numberPattern = /^-?\d*\.?\d+$/;
    return numberPattern.test(str);
}