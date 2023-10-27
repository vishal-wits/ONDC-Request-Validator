import { isValidTimeFormat } from "../common/index";

export const validateDays = (days: string): boolean => {
    if (typeof days !== 'string') {
        return false;
    }
    const dayArray = days.split(',').map(Number);
    const isValid = dayArray.every((day) => {
        return typeof day === 'number' && day >= 1 && day <= 7;
    });
    return isValid;
}

export const isValidTimesArray = (times: string[]): boolean => {
    if (times.length !== 2) {
        return false;
    }
    const [firstTime, secondTime] = times;

    if (!isValidTimeFormat(firstTime) || !isValidTimeFormat(secondTime)) {
        return false;
    }
    const firstTimeValue = parseInt(firstTime, 10);
    const secondTimeValue = parseInt(secondTime, 10);

    return secondTimeValue > firstTimeValue;
}

export const isValidGPSFormat = (gps: string): boolean => {
    const gpsPattern = /^\d+\.\d{6,}\s*,\s*\d+\.\d{6,}$/;
    return gpsPattern.test(gps);
}

export const doesNotContainHttpsOrWww = (str: string): boolean => {
    const pattern = /http|https|www/i;
    return !pattern.test(str);
}

export const isAddressLocalityValid = (address: Record<string, string>): boolean => {
    return (
        "locality" in address &&
        "street" in address &&
        address.locality?.trim() !== "" &&
        address.street?.trim() !== "" &&
        typeof address.locality === "string" &&
        typeof address.street === "string" &&
        address.locality !== address.street
    );
}

export const isValidDescriptorCode = (code: string): boolean => {
    const codePattern = /^[1-5]:.+/;
    return codePattern.test(code);
}

// {

//    key: "loc0adress_city"
// }