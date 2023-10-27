import fs from 'fs';
import path from 'path';
import { validateInput } from "./validateInput";

export const validateRET12 = async (validator_file_name: string) => {
    const filePath = path.join(__dirname, `../RET12ValidatorInput/${validator_file_name}.json`);

    try {
        if (fs.existsSync(filePath)) {
            const jsonData = fs.readFileSync(filePath, 'utf-8');

            try {
                const inputData = JSON.parse(jsonData);
                const validationErrors = await validateInput(inputData);
                if (validationErrors.length) {
                    throw new Error(JSON.stringify(validationErrors));
                } else {
                    console.log('⭐️🚀 Kudos! JSON is Valid ⭐️🚀');
                }
            } catch (err) {
                if (err.message) throw new Error(err.message);
                else throw new Error('➡️♠️ Invalid JSON file 👎');
            }
        } else {
            throw new Error(`➡️♠️ File not found 👎: ${validator_file_name}.json`);
        }
    } catch (err) {
        console.error('Oh-No!🙅👎 Invalid JSON input: ⬇️\n', err.message);
    }
};
