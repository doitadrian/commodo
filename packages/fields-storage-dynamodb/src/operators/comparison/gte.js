const gte = {
    canProcess: ({ value }) => {
        return value && typeof value["$gte"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} >= :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$gte"]
    }
};

export default gte;
