const validTypes = ["string", "boolean", "number"];

const eq = {
    canProcess: ({ key, value }) => {
        if (key && key.charAt(0) === "$") {
            return false;
        }

        if (value && typeof value["$eq"] !== "undefined") {
            return true;
        }

        return validTypes.includes(typeof value);
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} = :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value;
    }
};

export default eq;
