import { validateRET12 } from "./RET12/validator";
import { validateRetailOnStatus } from "./Retails/validator";

(async () => {
    // await validateRET12('onSearch_fashion_sample_data_valid');
    await validateRetailOnStatus();
})();

