export const validateBillingAddress = (baseAddress: any, validateAddress: any): { billingErr: string } => {
    const response: { billingErr: string } = { billingErr: '' }
    const errorKeys: string[] = [];
    try {
        for (const key in baseAddress) {
            if (key === 'address') {
                for (const addressKey in baseAddress[key]) {
                    if (baseAddress[key][addressKey] !== validateAddress[key][addressKey]) {
                        errorKeys.push(`address.${addressKey}`);
                    }
                }
            } else {
                if (baseAddress[key] !== validateAddress[key]) {
                    errorKeys.push(key);
                }
            }
        }
        if (errorKeys.length) response['billingErr'] = `${errorKeys.join(', ')} mismatches in billing object`
    } catch (error) {
        console.log("Oh-No!🙅👎 Encountered error while validating ===========:> ", error?.message);
        response['billingErr'] = `Oh-No!🙅👎 Encountered error while validating ${error?.message}`;
    }
    return response;
}