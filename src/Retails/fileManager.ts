
import fs from 'fs';
import path from 'path';
import orderStateSequence from './constant/orderStateSequence';

export const getRetailsOnStatusData = () => {
    const data: { state: string, data: any, error: string }[] = []
    orderStateSequence.forEach(order_status => {
        const filePath = path.join(__dirname, `./validatorInput/on_status_${order_status}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const jsonData = fs.readFileSync(filePath, 'utf-8');
                const inputData = JSON.parse(jsonData);
                data.push({ state: order_status, data: inputData, error: '' });
            } catch (err) {
                data.push({ state: order_status, data: null, error: err.message || `➡️♠️ On Status Invalid JSON file 👎` });
            }
        }
    })
    return data;
};

export const getRetailsOnConfirm = () => {
    const filePath = path.join(__dirname, `./validatorInput/on_confirm.json`);
    if (fs.existsSync(filePath)) {
        try {
            const jsonData = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(jsonData);
        } catch (err) {
            return null;
        }
    }
};

export const getStatusTimestampJson = () => {
    const filePath = path.join(__dirname, `./temporaryFiles/temporary.json`);
    if (fs.existsSync(filePath)) {
        try {
            const jsonData = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(jsonData);
        } catch (err) {
            return null;
        }
    }
};

export const saveStateTimestamp = (state: string, timestamp: string) => {
    let timestamp_json = getStatusTimestampJson();
    if (!timestamp_json) timestamp_json = {};
    timestamp_json[state] = timestamp;
    writeStateTimestamp(timestamp_json);
};

export const writeStateTimestamp = (state_timestamp_json: any) => {
    const data = JSON.stringify(state_timestamp_json);
    const filePath = path.join(__dirname, `./temporaryFiles/temporary.json`);
    if (fs.existsSync(filePath)) {
        try {
            fs.writeFileSync(filePath, data, 'utf8');
        } catch (err) {
            throw err;
        }
    }
}