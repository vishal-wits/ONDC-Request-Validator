import * as fs from 'fs';
import * as path from 'path';
import { distanceUnit, fulfillmentsType, isEmailValid, isPhoneNumberValid, isValidDate, isValidTimestamp, isValidDateFormat, isValidNumber, isValidTimeFormat, timeLabel, tagsCode, tagsListCode, counrtyCode, ItemTagsCode } from "../common";
import cityToPincodeMapping from "../common/cityToPincodeMapping";
import { isAddressLocalityValid, isValidDescriptorCode, isValidGPSFormat, isValidTimesArray, validateDays } from "../common/helper";
import attributes from "./constant/attributes";
import itemCategories from "./constant/categories";
import categoryAttributeRelationship from "./constant/categoryAttributeRelationship";
import attributesColumn from "./constant/attributesColumn";

/**
 * INFO: Verify json message object
 * @param message 
 * @returns { message: string, key: string }[]
 */
export const validateMessage = async (message: any, contextTimestamp: string) => {
    const { catalog } = message;
    let errors: { message: string, key: string }[] = [];
    if (!catalog) {
        errors.push({ message: '➡️♠️ Missing required field in message - catalog', key: `message_catalog` });
        return errors;
    }

    if (!catalog['bpp/fulfillments'] || !Array.isArray(catalog['bpp/fulfillments']) || !catalog['bpp/fulfillments']?.length) {
        errors.push({ message: '➡️♠️ Missing required field in message > catalog - bpp/fulfillments', key: `message_bpp/fulfillments` });
    } else {
        validateBppFulfillments(errors, catalog['bpp/fulfillments']);
    }

    if (!catalog['bpp/descriptor']) {
        errors.push({ message: '➡️♠️ Missing required field in message > catalog - bpp/descriptor', key: `message_bpp/descriptor` });
    } else {
        validateDescriptor(errors, catalog['bpp/descriptor'], 'bpp/descriptor');
    }

    if (!catalog['bpp/providers'] || !Array.isArray(catalog['bpp/providers']) || !catalog['bpp/providers']?.length) {
        errors.push({ message: '➡️♠️ Missing required field in message > catalog - bpp/providers', key: `message_bpp/providers` });
    } else {
        await validateBppProviders(errors, catalog['bpp/providers'], contextTimestamp);
    }

    return errors;
};

/**
 * INFO: Validate bpp/fulfillments type
 * @param errors 
 * @param payload 
 */
const validateBppFulfillments = (errors: any[], payload: any) => {
    if (!payload.every((item: { type: string; }) => fulfillmentsType.includes(item.type))) {
        errors.push({ message: '➡️♠️ bpp/fulfillments types are not valid, it should be from (' + fulfillmentsType.join(', ') + ')', key: `message_bpp/fulfillments_types` });
    }
}

/**
 * INFO: Validate bpp/descriptor each elements
 * @param errors 
 * @param payload 
 * @param path 
 */
const validateDescriptor = (errors: any[], payload: any, path: string, isItemDescriptor: boolean = false) => {
    for (const key in payload) {
        if (payload.hasOwnProperty(key)) {
            const value = payload[key];

            if (key === 'images' && !Array.isArray(value)) {
                errors.push({ message: `➡️♠️ Missing required field in ${path} - ${key}`, key: `${path.replace(/ > /g, '_')}_${key}` });
            }
            if (key === 'tags' && !Array.isArray(value)) {
                errors.push({ message: `➡️♠️ Missing required field in ${path} - ${key}`, key: `${path.replace(/ > /g, '_')}_${key}` });
            }

            if (isItemDescriptor && key === 'code') {
                if (!isValidDescriptorCode(value)) {
                    errors.push({ message: `➡️♠️ The ${key} should be valid in ${path} - ${key}`, key: `${path.replace(/ > /g, '_')}_${key}` });
                }
            } else if (key !== 'images' && key !== 'tags' && (typeof value !== 'string' || !value)) {
                errors.push({ message: `➡️♠️ Missing required field in ${path} - ${key}`, key: `${path.replace(/ > /g, '_')}_${key}` });
            }
        }
    }
}

/**
 * INFO: Validate bpp/providers each elements
 * @param errors 
 * @param payload 
 */
const validateBppProviders = async (errors: any[], payload: any, contextTimestamp: string) => {
    await Promise.all(payload.map(async (item: { id: any; time: any; fulfillments: any; descriptor: any; ttl: any; locations: any; categories: any; items: any; tags: any; }, providerIndex: number) => {
        const { id, time, fulfillments, descriptor, ttl, locations, categories, items, tags } = item;

        // id
        if (!id || typeof id != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - id in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_id` });
        }

        // time
        if (!time || typeof time != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - time in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_time` });
        } else {
            validateLabelAndTime(errors, time, contextTimestamp, `message > catalog > bpp/providers${providerIndex}`)
        }

        // fulfillments
        if (!fulfillments || !fulfillments?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - fulfillments in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_fulfillments` });
        } else {
            validateFulfillments(errors, fulfillments, providerIndex);
        }

        // descriptor
        if (!descriptor || typeof descriptor != 'object') {
            errors.push({ message: `➡️♠️ Missing required field - descriptor in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_descriptor` });
        } else {
            validateDescriptor(errors, descriptor, `message > catalog > bpp/providers${providerIndex}`);
        }

        // ttl
        if (!ttl || typeof ttl != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - ttl in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_ttl` });
        }

        // locations
        if (!locations || !locations?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - locations in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_locations` });
        } else {
            validateLocation(errors, locations, contextTimestamp, providerIndex);
        }

        // categories
        if (!categories || !categories?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - categories in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_categories` });
        } else {
            await validateCategories(errors, categories, providerIndex);
        }

        // items
        if (!items || !items?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - items in message > catalog > bpp/providers${providerIndex}`, key: `message_catalog_bpp/providers${providerIndex}_items` });
        } else {
            await validateItems(errors, items, categories, contextTimestamp, providerIndex);
        }

    }));
}

// ********* SUPPORTING FUNCTION TO VALIDATE BPP/PROVIDERS ********** 

/**
 * INFO: Validate fulfillments each elements
 * @param errors 
 * @param payload
 */
const validateItems = async (errors: any[], payload: any, categories: any, contextTimestamp: string, providerIndex: number) => {
    await Promise.all(payload.map(async (el: any, index: number) => {
        const { id, time, parent_item_id, descriptor, quantity, price, category_id, fulfillment_id, location_id, tags } = el;
        let isValidCategoryId = false;
        // id
        if (!id || typeof id != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_id` });
        }
        // time
        if (!time || typeof time != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - time in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_time` });
        } else {
            validateLabelAndTime(errors, time, contextTimestamp, `message > catalog > bpp/providers${providerIndex} > items${index}`);
        }
        // parent_item_id
        if (!parent_item_id || typeof parent_item_id != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - parent_item_id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_parent_item_id` });
        } else {
            let match = categories.find((cat: { id: string; }) => cat?.id === parent_item_id);
            if (!match) {
                errors.push({ message: `➡️♠️ Missing mendatory field - parent_item_id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_parent_item_id` });
            }
        }
        // descriptor
        if (!descriptor || typeof descriptor != 'object') {
            errors.push({ message: `➡️♠️ Missing required field - descriptor at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_descriptor` });
        } else {
            validateDescriptor(errors, descriptor, `message > catalog > bpp/providers${providerIndex} > items${index}`);
        }
        // quantity
        if (!quantity || typeof quantity != 'object') {
            errors.push({ message: `➡️♠️ Missing required field - quantity at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity` });
        } else {
            validateItemsQuantity(errors, quantity, providerIndex, index);
        }
        // price
        if (!price || typeof price != 'object') {
            errors.push({ message: `➡️♠️ Missing required field - price at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_price` });
        } else {
            validateItemsPrice(errors, price, providerIndex, index);
        }
        // category_id
        if (!category_id || typeof category_id != 'string') {
            errors.push({ message: `➡️♠️ Missing required field - category_id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_category_id` });
        } else if (!itemCategories.includes(category_id)) {
            errors.push({ message: `➡️♠️ Category_id should be valid at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_category_id` });
        } else {
            isValidCategoryId = true;
        }
        // fulfillment_id
        if (!fulfillment_id || typeof fulfillment_id != 'string') {
            errors.push({ message: `➡️♠️ Missing required field - fulfillment_id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_fulfillment_id` });
        }
        // location_id
        if (!location_id || typeof location_id != 'string') {
            errors.push({ message: `➡️♠️ Missing required field - location_id at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_location_id` });
        }

        // @ondc/org/returnable
        if (el && (!el.hasOwnProperty('@ondc/org/returnable') || typeof el['@ondc/org/returnable'] != 'boolean')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/returnable at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/returnable` });
        }
        // @ondc/org/cancellable
        if (el && (!el.hasOwnProperty('@ondc/org/cancellable') || typeof el['@ondc/org/cancellable'] != 'boolean')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/cancellable at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/cancellable` });
        }
        // @ondc/org/return_window
        if (el && (!el['@ondc/org/return_window'] || typeof el['@ondc/org/return_window'] != 'string')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/return_window at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/return_window` });
        }
        // @ondc/org/seller_pickup_return
        if (el && (!el.hasOwnProperty('@ondc/org/seller_pickup_return') || typeof el['@ondc/org/seller_pickup_return'] != 'boolean')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/seller_pickup_return at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/seller_pickup_return` });
        }
        // @ondc/org/time_to_ship
        if (el && (!el['@ondc/org/time_to_ship'] || typeof el['@ondc/org/time_to_ship'] != 'string')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/time_to_ship at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/time_to_ship` });
        }
        // @ondc/org/available_on_cod
        if (el && (!el.hasOwnProperty('@ondc/org/available_on_cod') || typeof el['@ondc/org/available_on_cod'] != 'boolean')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/available_on_cod at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/available_on_cod` });
        }
        // @ondc/org/contact_details_consumer_care
        if (el && (!el['@ondc/org/contact_details_consumer_care'] || typeof el['@ondc/org/contact_details_consumer_care'] != 'string')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/contact_details_consumer_care at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/contact_details_consumer_care` });
        } else {
            const contact_details_consumer_care = el['@ondc/org/contact_details_consumer_care'].split(',');
            if (contact_details_consumer_care.length != 3) {
                errors.push({ message: `➡️♠️ Invalid @ondc/org/contact_details_consumer_care which should have name,email,mobile at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/contact_details_consumer_care` });
            } else {
                if (!contact_details_consumer_care[1] || !isEmailValid(contact_details_consumer_care[1].trim())) {
                    errors.push({ message: `➡️♠️ Invalid email of @ondc/org/contact_details_consumer_care at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/contact_details_consumer_care` });
                }
                if (!contact_details_consumer_care[2] || !isPhoneNumberValid(contact_details_consumer_care[2].trim())) {
                    errors.push({ message: `➡️♠️ Invalid mobile of @ondc/org/contact_details_consumer_care at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/contact_details_consumer_care` });
                }
            }
        }
        // @ondc/org/statutory_reqs_packaged_commodities
        if (el && (!el['@ondc/org/statutory_reqs_packaged_commodities'] || typeof el['@ondc/org/statutory_reqs_packaged_commodities'] != 'object')) {
            errors.push({ message: `➡️♠️ Missing/Invalid required field - @ondc/org/statutory_reqs_packaged_commodities at items index ${index} in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/statutory_reqs_packaged_commodities` });
        } else {
            validateItemsPackageCommodity(errors, el['@ondc/org/statutory_reqs_packaged_commodities'], providerIndex, index);
        }
        // tags
        if (!tags || !Array.isArray(tags) || !tags?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - tags in message > catalog > bpp/providers${providerIndex} > items`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_tags` });
        } else {
            await validateItemsTags(errors, tags, category_id, isValidCategoryId, providerIndex, index);
        }

    }))
}

/**
 * INFO: Validate item tags
 * @param errors 
 * @param payload 
 */
const validateItemsTags = async (errors: any[], payload: any, category_id: string, isValidCategoryId: boolean, providerIndex: number, itemIndex: number) => {
    await Promise.all(payload.map(async (el: { code: string; list: any }, index: number) => {
        const { code, list } = el;
        let isValidCode = false;
        if (!code || typeof code != 'string') {
            errors.push({ message: `➡️♠️ Missing required field - code at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_code` });
        } else if (!ItemTagsCode.includes(code)) {
            errors.push({ message: `➡️♠️ Code should be valid and its varries in (${ItemTagsCode.join(', ')}) at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_code` });
        } else {
            isValidCode = true;
        }

        if (!list || !Array.isArray(list) || !list?.length) {
            errors.push({ message: `➡️♠️ Missing required field - list at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list` });
        } else {
            if (isValidCode && code === 'attribute') {
                if (!isValidCategoryId) {
                    errors.push({ message: `➡️♠️ Item category id should be valid and then provide the attribute mandatory list data at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list` });
                } else if (category_id) {
                    validateCategoryTagsListCode(errors, list, category_id, providerIndex, itemIndex, index);
                }
            }
            list.forEach((item: any, listIndex: number) => {
                if (!item) {
                    errors.push({ message: `➡️♠️ Each item should be valid in list at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}` });
                } else {
                    if (!item.code || typeof item.code != 'string') {
                        errors.push({ message: `➡️♠️ Missing required field - code at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_code` });
                    }
                    if (!item.value || typeof item.value != 'string') {
                        errors.push({ message: `➡️♠️ Missing required field - value at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_value` });
                    }
                    if (isValidCode && code === 'origin' && item.code !== 'country') {
                        errors.push({ message: `➡️♠️ Item tags list code should be country if tags code is origin at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_code` });
                    }
                    if (item.code && isValidCode && code === 'attribute' && isValidCategoryId && category_id) {
                        const listCode = item.code.toLowerCase().replace(/ /g, '_');
                        let codeData = getCategoryAttributeValues(listCode);
                        if (item.value && codeData && codeData[listCode] && codeData[listCode].length) {
                            if (listCode === 'colour') {
                                if (!codeData[listCode].some(([name, color]) => name === item.value || color === item.value)) {
                                    errors.push({ message: `➡️♠️ Item tags list value for colour i.e. ${item.value} should be valid and appropriate at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_value` });
                                }
                            } else if (listCode === 'size') {
                                if (category_id && !codeData[category_id].includes(item.value)) {
                                    errors.push({ message: `➡️♠️ Item tags list value for size i.e. ${item.value} should be valid and appropriate at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_value` });
                                }
                            } else if (!codeData[listCode].includes(item.value)) {
                                errors.push({ message: `➡️♠️ Item tags list value i.e. ${item.value} should be valid and appropriate at items index ${itemIndex}, tags index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > items > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list${listIndex}_value` });
                            }
                        }
                    }
                }
            })
        }
    }))
}

/**
 * INFO: Read source data from file
 * @param filename 
 */
const getCategoryAttributeValues = (fileName: string) => {
    try {
        const filePath = path.join(__dirname, 'attributesValues', `${fileName}.json`);
        if (!fs.existsSync(filePath)) {
            console.warn(`File ${filePath} does not exist.`);
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const values = JSON.parse(data);
        return values;
    } catch (err) {
        throw err;
    }
};

/**
 * INFO: Validate code of categories tag list
 * @param errors 
 * @param payload 
 * @param category_id 
 * @param itemIndex 
 * @param index 
 */
const validateCategoryTagsListCode = (errors: any[], payload: any, category_id: string, providerIndex: number, itemIndex: number, index: number) => {
    const mandatoryObj = categoryAttributeRelationship.find(el => el.category == category_id);
    if (mandatoryObj) {
        const keysWithMandatory = Object.keys(mandatoryObj).filter(key => mandatoryObj[key] === "M");
        if (keysWithMandatory?.length) {
            const valuesWithMapping = keysWithMandatory.map((key) => attributesColumn[key]);
            if (valuesWithMapping?.length) {
                const requiredCodes = valuesWithMapping.filter(allowedCode => !payload.some((item: { code: string; }) => item.code?.toLowerCase().replace(/ /g, '_') === allowedCode?.toLowerCase().replace(/ /g, '_')));
                if (requiredCodes?.length) {
                    errors.push({ message: `➡️♠️ Missing Mandatory attributes in list, mandatory attributes are ${valuesWithMapping.join(', ')} at items index ${itemIndex} and tags index ${index} in message > catalog > bpp/providers${providerIndex} > items > tags`, key: `message_catalog_bpp/providers${providerIndex}_items${itemIndex}_tags${index}_list` });
                }
            }
        }
    }
}

/**
 * INFO: Validate item @ondc/org/statutory_reqs_packaged_commodities
 * @param errors 
 * @param payload 
 */
const validateItemsPackageCommodity = (errors: any[], payload: any, providerIndex: number, index: number) => {
    const { manufacturer_or_packer_name, manufacturer_or_packer_address, common_or_generic_name_of_commodity, month_year_of_manufacture_packing_import } = payload;
    if (!manufacturer_or_packer_name || typeof manufacturer_or_packer_name != 'string') {
        errors.push({ message: `➡️♠️ Missing required field - manufacturer_or_packer_name at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > @ondc/org/statutory_reqs_packaged_commodities`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/statutory_reqs_packaged_commodities_manufacturer_or_packer_name` });
    }
    if (!manufacturer_or_packer_address || typeof manufacturer_or_packer_address != 'string') {
        errors.push({ message: `➡️♠️ Missing required field - manufacturer_or_packer_address at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > @ondc/org/statutory_reqs_packaged_commodities`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/statutory_reqs_packaged_commodities_manufacturer_or_packer_address` });
    }
    if (!common_or_generic_name_of_commodity || typeof common_or_generic_name_of_commodity != 'string') {
        errors.push({ message: `➡️♠️ Missing required field - common_or_generic_name_of_commodity at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > @ondc/org/statutory_reqs_packaged_commodities`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/statutory_reqs_packaged_commodities_common_or_generic_name_of_commodity` });
    }
    if (!month_year_of_manufacture_packing_import || typeof month_year_of_manufacture_packing_import != 'string') {
        errors.push({ message: `➡️♠️ Missing required field - month_year_of_manufacture_packing_import at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > @ondc/org/statutory_reqs_packaged_commodities`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_@ondc/org/statutory_reqs_packaged_commodities_month_year_of_manufacture_packing_import` });
    }
}

/**
 * INFO: Validate item price
 * @param errors 
 * @param payload 
 */
const validateItemsPrice = (errors: any[], payload: any, providerIndex: number, index: number) => {
    const { currency, value, maximum_value } = payload;
    if (!currency || typeof currency != 'string') {
        errors.push({ message: `➡️♠️ Missing required field - currency at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > price`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_price_currency` });
    } else if (currency !== 'INR') {
        errors.push({ message: `➡️♠️ Currency should be INR at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > price`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_price_currency` });
    }
    if (!value || typeof value != 'string' || isNaN(Number(value))) {
        errors.push({ message: `➡️♠️ Missing required field - value at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > price`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_price_value` });
    }
    if (!maximum_value || typeof maximum_value != 'string' || isNaN(Number(maximum_value))) {
        errors.push({ message: `➡️♠️ Missing required field - maximum_value at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > price`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_price_maximum_value` });
    }
}

/**
 * INFO: Validate item quantity
 * @param errors 
 * @param payload 
 */
const validateItemsQuantity = (errors: any[], payload: any, providerIndex: number, index: number) => {
    const { unitized, available, maximum } = payload;
    if (!unitized || typeof unitized != 'object') {
        errors.push({ message: `➡️♠️ Missing required field - unitized at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_unitized` });
    } else {
        const { measure } = unitized;
        if (!measure || typeof measure != 'object') {
            errors.push({ message: `➡️♠️ Missing required field - measure at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity > unitized`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_measure` });
        } else {
            const { unit, value } = measure;
            if (!unit || typeof unit != 'string') {
                errors.push({ message: `➡️♠️ Missing required field - unit at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity > unitized > measure`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_measure_unit` });
            }
            if (!value || typeof value != 'string' || isNaN(Number(value)) || Number(value) < 1) {
                errors.push({ message: `➡️♠️ Missing required field - value at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity > unitized > measure`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_measure_value` });
            }
        }
    }
    if (!available || typeof available != 'object') {
        errors.push({ message: `➡️♠️ Missing required field - available at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_available` });
    } else if (!available.count || typeof available.count != 'string' || isNaN(Number(available?.count)) || Number(available?.count) < 1) {
        errors.push({ message: `➡️♠️ Available count should be included and it should be > 0 at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_available_count` });
    }
    if (!maximum || typeof maximum != 'object') {
        errors.push({ message: `➡️♠️ Missing required field - maximum at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_maximum` });
    } else if (!maximum.count || typeof maximum.count != 'string' || isNaN(Number(maximum?.count)) || Number(maximum?.count) < 1) {
        errors.push({ message: `➡️♠️ Maximum count should be included and it should be > 0 at items index ${index} in message > catalog > bpp/providers${providerIndex} > items > quantity`, key: `message_catalog_bpp/providers${providerIndex}_items${index}_quantity_maximum_count` });
    }
}

/**
 * INFO: Validate fulfillments each elements
 * @param errors 
 * @param payload
 */
const validateFulfillments = (errors: any[], payload: any, providerIndex: number) => {
    payload.forEach((el: { contact: any; }, index: number) => {
        const { contact } = el;
        if (!contact || typeof contact != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - contact at fulfillments index ${index} in message > catalog > bpp/providers${providerIndex} > fulfillments`, key: `message_catalog_bpp/providers${providerIndex}_fulfillments${index}_contact` });
        } else {
            const { phone, email } = contact;
            if (!phone || typeof phone != 'string' || !isPhoneNumberValid(phone)) {
                errors.push({ message: `➡️♠️ Mendatory field invalid - contact.phone at fulfillments index ${index} in message > catalog > bpp/providers${providerIndex} > fulfillments`, key: `message_catalog_bpp/providers${providerIndex}_fulfillments${index}_contact_phone` });
            }
            if (!email || typeof email != 'string' || !isEmailValid(email)) {
                errors.push({ message: `➡️♠️ Mendatory field invalid - contact.email at fulfillments index ${index} in message > catalog > bpp/providers${providerIndex} > fulfillments`, key: `message_catalog_bpp/providers${providerIndex}_fulfillments${index}_contact_email` });
            }
        }
    })
}

/**
 * INFO: Validate bpp/providers locations each elements
 * @param errors 
 * @param payload
 */
const validateLocation = (errors: any[], payload: any, contextTimestamp: string, providerIndex: number) => {
    payload.forEach((el: { id: string; time: object; gps: string; address: object; circle: object; }, index: number) => {
        const { id, time, gps, address, circle } = el;
        if (!id || typeof id != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - id at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_id` });
        }

        if (!time || typeof time != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - contact at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_contact` });
        } else {
            validateLocationTime(errors, time, contextTimestamp, providerIndex, index);
        }

        if (!gps || typeof gps != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - gps at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_gps` });
        } else if (!isValidGPSFormat(gps)) {
            errors.push({ message: `➡️♠️ GPS data should be valid - at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_gps` });
        }

        if (!address || typeof address != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - address at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_address` });
        } else {
            validateLocationAddress(errors, address, providerIndex, index);
        }

        if (!circle || typeof circle != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - circle at locations index ${index} in message > catalog > bpp/providers${providerIndex} > locations`, key: `message_catalog_bpp/providers${providerIndex}_locations${index}_circle` });
        } else {
            validateLocationCircle(errors, circle, providerIndex, index);
        }
    })
}

/**
 * INFO: Validate Location address
 * @param errors 
 * @param payload 
 */
const validateLocationCircle = (errors: any[], payload: any, providerIndex: number, locationIndex: number) => {
    const { gps, radius } = payload;
    if (!gps || typeof gps != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - gps at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_gps` });
    } else if (!isValidGPSFormat(gps)) {
        errors.push({ message: `➡️♠️ GPS data should be valid - at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_gps` });
    }

    if (!radius || typeof radius != 'object') {
        errors.push({ message: `➡️♠️ Missing mendatory field - radius at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_radius` });
    } else {
        const { unit, value } = radius;
        if (!unit || typeof unit != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - unit at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle > radius`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_radius_unit` });
        } else if (!distanceUnit.includes(unit)) {
            errors.push({ message: `➡️♠️ Radius unit should be valid - at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle > radius`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_radius_unit` });
        }

        if (!value || typeof value != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - value at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle > radius`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_radius_value` });
        } else if (!isValidNumber(value)) {
            errors.push({ message: `➡️♠️ Radius value should be valid - at locations index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > circle > radius`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_circle_radius_value` });
        }
    }
}

/**
 * INFO: Validate label and time
 * @param errors 
 * @param payload 
 */
const validateLabelAndTime = (errors: any[], payload: any, contextTimestamp: string, path: string) => {
    const { label, timestamp } = payload;
    if (!label || typeof label != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - time.label in ${path}`, key: `${path.replace(/ > /g, '_')}_time_label` });
    } else if (!timeLabel.includes(label)) {
        errors.push({ message: `➡️♠️ time.label is not valid in ${path}, it should be only (${timeLabel.join(', ')})`, key: `${path.replace(/ > /g, '_')}_time_label` });
    }
    if (!timestamp || typeof timestamp != 'string' || !isValidTimestamp(timestamp)) {
        errors.push({ message: `➡️♠️ Missing mendatory field - timestamp in ${path}`, key: `${path.replace(/ > /g, '_')}_time_timestamp` });
    } else if (new Date(timestamp) > new Date(contextTimestamp)) {
        errors.push({ message: `➡️♠️ Timestamp can't be greater then context.timestamp in ${path}`, key: `${path.replace(/ > /g, '_')}_time_timestamp` });
    }
}

/**
 * INFO: Validate bpp/providers location time each elements
 * NOTE: - label only allowed enable, disable 
 *       - Either frequency and times required or range is required
 *       - days should contains 1-7 only
 *       - holidays only have date part in yyyy-mm-dd format
 * @param errors 
 * @param payload 
 */
const validateLocationTime = (errors: any[], payload: any, contextTimestamp: string, providerIndex: number, locationIndex: number) => {
    const { label, timestamp, days, schedule, range } = payload;
    validateLabelAndTime(errors, { label, timestamp }, contextTimestamp, `message > catalog > bpp/providers${providerIndex} > location${locationIndex} > time`);
    if (!days) {
        errors.push({ message: `➡️♠️ Missing mendatory field - days at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_days` });
    } else if (!validateDays(days)) {
        errors.push({ message: `➡️♠️ Days should be valid (i.e. 1,2,3,4,5,6,7) at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_days` });
    }
    const { holidays, frequency, times } = schedule;
    if (holidays && holidays.length) {
        if (!holidays.every((item: string) => isValidDateFormat(item))) {
            errors.push({ message: `➡️♠️ Schedule holidays should be valid i.e. yyyy-mm-dd format at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_schedule_holidays` });
        }
    }
    if (!range && !(frequency && times)) {
        errors.push({ message: `➡️♠️ Either range or frequency & times should be included at location index ${locationIndex} in - message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time` });
    } else if (range) {
        if (!isValidTimeFormat(range?.start)) {
            errors.push({ message: `➡️♠️ Range.start should be valid (HHmm) at location index ${locationIndex} in - message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_range_start` });
        }
        if (!isValidTimeFormat(range?.end)) {
            errors.push({ message: `➡️♠️ Range.end should be valid (HHmm) at location index ${locationIndex} in - message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_range_end` });
        }
        if (range?.start && range?.end && parseInt(range?.start, 10) > parseInt(range?.end, 10)) {
            errors.push({ message: `➡️♠️ Range.end should be greater then range.start at location index ${locationIndex} in - message > catalog > bpp/providers${providerIndex} > location > time`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_range` });
        }
    } else if (frequency && times) {
        if (!frequency || typeof frequency != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - frequency at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > time > schedule`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_schedule_frequency` });
        }
        if (!times || !times?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - times at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > time > schedule`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_schedule_times` });
        } else if (!isValidTimesArray(times)) {
            errors.push({ message: `➡️♠️ End time should be greater then start at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > time > schedule`, key: `message_catalog_bpp/providers${providerIndex}_location${locationIndex}_time_schedule_times` });
        }
    }


}

/**
 * INFO: Validate Location address
 * @param errors 
 * @param payload 
 */
const validateLocationAddress = (errors: any[], payload: any, providerIndex: number, locationIndex: number) => {
    const { locality, street, city, area_code, state } = payload;
    if (!locality || typeof locality != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - locality at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_locality` });
    }
    if (!street || typeof street != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - street at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_street` });
    }

    if (locality && street && !isAddressLocalityValid(payload)) {
        errors.push({ message: `➡️♠️ Locality and Street shouldn't be same at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address` });
    }
    if (!city || typeof city != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - city at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_city` });
    }
    if (!area_code || typeof area_code != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - area_code at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_area_code` });
    } else {
        if (!cityToPincodeMapping.some(x => x["Pincode"] === Number(area_code))) {
            errors.push({ message: `➡️♠️ area_code should be valid at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_area_code` });
        }
    }
    if (!state || typeof state != 'string') {
        errors.push({ message: `➡️♠️ Missing mendatory field - state at location index ${locationIndex} in message > catalog > bpp/providers${providerIndex} > locations > address`, key: `message_catalog_bpp/providers${providerIndex}_locations${locationIndex}_address_state` });
    }
}

/**
 * INFO: Validate bpp/providers categories each elements
 * @param errors 
 * @param payload
 */
const validateCategories = async (errors: any[], payload: any, providerIndex: number) => {
    await Promise.all(payload.map(async (el: { id: string; descriptor: object; tags: string; }, index: number) => {
        const { id, descriptor, tags } = el;
        if (!id || typeof id != 'string') {
            errors.push({ message: `➡️♠️ Missing mendatory field - id at categories index ${index} in message > catalog > bpp/providers${providerIndex} > categories`, key: `message_catalog_bpp/providers${providerIndex}_categories${index}_id` });
        }

        if (!descriptor || typeof descriptor != 'object') {
            errors.push({ message: `➡️♠️ Missing mendatory field - descriptor at categories index ${index} in message > catalog > bpp/providers${providerIndex} > categories`, key: `message_catalog_bpp/providers${providerIndex}_categories${index}_descriptor` });
        } else {
            validateDescriptor(errors, descriptor, `message > catalog > bpp/providers${providerIndex} > categories${index}`);
        }
        if (!tags || !Array.isArray(tags) || !tags?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - tags at categories index ${index} in message > catalog > bpp/providers${providerIndex} > categories`, key: `message_catalog_bpp/providers${providerIndex}_categories${index}_tags` });
        } else {
            await validateTags(errors, tags, providerIndex, index);
        }
    }))
}

/**
 * INFO: Validate tags each elements
 * @param errors 
 * @param payload
 */
const validateTags = async (errors: any[], payload: any, providerIndex: number, categoryIndex: number) => {
    const seqValues = new Set();

    payload.forEach((el: { code: string, list: any; }, index: number) => {
        const { code, list } = el;
        if (!code || typeof code != 'string') {
            errors.push({ message: `➡️♠️ Mendatory field missing - code at category index ${categoryIndex} and tag index ${index} in message > catalog > bpp/providers${providerIndex} > categories > tags`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_code` });
        } else if (!tagsCode.includes(code)) {
            errors.push({ message: `➡️♠️ Categories code should be in (${tagsCode.join(', ')}) at category index ${categoryIndex} and tag index ${index}`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_code` });
        }

        if (!list || !Array.isArray(list) || !list?.length) {
            errors.push({ message: `➡️♠️ Missing mendatory field - list at category index ${categoryIndex} and tag index ${index} in message > catalog > bpp/providers${providerIndex} > categories > tags and it should be array`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list` });
        } else {

            list.forEach((listItem: { code: string, value: any; }, listIndex: number) => {
                let isCodeValid = false;
                if (!listItem.code || typeof listItem.code != 'string') {
                    errors.push({ message: `➡️♠️ Mendatory field missing - code at category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_code` });
                } else if (!tagsListCode.includes(listItem.code)) {
                    errors.push({ message: `➡️♠️ Categories code should be in (${tagsListCode.join(', ')}) at category index ${categoryIndex}, tag index ${index} and list index ${listIndex}`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_code` });
                } else {
                    isCodeValid = true;
                }
                if (!listItem.value || typeof listItem.value != 'string') {
                    errors.push({ message: `➡️♠️ Mendatory field missing - value at category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_value` });
                } else if (isCodeValid) {
                    switch (listItem.code) {
                        case 'type':
                            if (code === listItem.code && listItem.value !== 'variant_group') {
                                errors.push({ message: `➡️♠️ Categories list value should be 'variant_group' if code is type at category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_value` });
                            }
                            break;
                        case 'name':
                            const parts = listItem.value.split(".");
                            if (listItem.value.includes('item.tags') && !(
                                parts.length === 4 &&
                                parts[0] === "item" &&
                                parts[1] === "tags" &&
                                parts[2] === "attribute" &&
                                attributes.some(attr => attr.toLowerCase().replace(/ /g, '_') === parts[3]))) { // attr.toLowerCase().replace(/ /g, '_')
                                errors.push({ message: `➡️♠️ Categories list value should be valid if code is name category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_value` });
                            }
                            break;
                        case 'seq':
                            if (isNaN(Number(listItem.value))) {
                                errors.push({ message: `➡️♠️ Categories list value should be valid number if code is seq category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories > tags > list`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_value` });
                            }
                            if (seqValues.has(listItem.value)) {
                                errors.push({ message: `➡️♠️ All the categories list seq number should be unique category index ${categoryIndex}, tag index ${index} and list index ${listIndex} in message > catalog > bpp/providers${providerIndex} > categories`, key: `message_catalog_bpp/providers${providerIndex}_categories${categoryIndex}_tags${index}_list${listIndex}_value` });
                            }
                            seqValues.add(listItem.value);
                            break;
                        default:
                            break;
                    }
                }
            })
        }
    })
}
