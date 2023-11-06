
export const compareTwoJSON = (baseJSON: any, validateJSON: any): { mismatchedErr: string } => {
    const response: { mismatchedErr: string } = { mismatchedErr: '' }
    try {
        if (typeof baseJSON === 'object' && typeof validateJSON === 'object') {
            const errorKeys = findDifferentKey(baseJSON, validateJSON);
            if (errorKeys.length) response['mismatchedErr'] = `${errorKeys.join(', ')} mismatches in provided json`
        } else {
            response['mismatchedErr'] = `Provided input json is not valid`
        }
    } catch (error) {
        console.log("Oh-No!🙅👎 Encountered error while validating ===========:> ", error?.message);
        response['mismatchedErr'] = `Oh-No!🙅👎 Encountered error while validating ${error?.message}`;
    }
    return response;
}


const findDifferentKey = (baseObj: any, targetObj: any, currentPath: string = '', differentKeys: string[] = []): string[] => {
    if (baseObj === targetObj) {
        return differentKeys;
    }

    if (typeof baseObj !== 'object' || typeof targetObj !== 'object') {
        if (baseObj !== targetObj) {
            differentKeys.push(currentPath);
        }
        return differentKeys;
    }
    const baseKeys = Object.keys(baseObj);
    const targetKeys = Object.keys(targetObj);

    for (let key of baseKeys) {
        if (!targetKeys.includes(key)) {
            differentKeys.push(currentPath + key);
        } else {
            differentKeys = findDifferentKey(baseObj[key], targetObj[key], currentPath + (currentPath ? '_': '') + key, differentKeys)
        }
    }
    return differentKeys;
}