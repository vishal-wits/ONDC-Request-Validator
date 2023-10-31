
import { validateInput } from "./validateInput";
import { getRetailsOnStatusData } from "./fileManager";

export const validateRetailOnStatus = async () => {
    let response: { state: string, message: string, response: any }[] = [];
    try {
        const ordersStatus = getRetailsOnStatusData();
        await Promise.all(ordersStatus.map(async (el) => {
            let errors: { message: string, key: string }[] = [];
            if (el.data) {
                const validationErrors = await validateInput(el.data, el.state);
                if (validationErrors.length) {
                    response.push({  state: el.state, message: 'Oh-No!🙅👎 Invalid JSON input: ⬇️\n', response: validationErrors });
                } else {
                    response.push({ state: el.state, message: '⭐️🚀 Kudos! On Status JSON is Valid ⭐️🚀', response: [] });
                }
            } else {
                response.push({  state: el.state, message: 'Oh-No!🙅👎 Facing issue in json read', response: el.error });
            }
        }))
        console.log('⭐️🚀 All State result as below ⬇️ \n', JSON.stringify(response))
    } catch (err) {
        console.log(err);
        console.error("Oh-No!🙅👎 All state haven't verified properly and catch error ⬇️\n", err.message );
    }
};


