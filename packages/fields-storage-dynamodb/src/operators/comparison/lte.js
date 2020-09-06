const lte = {
    canProcess: ({ value }) => {
        return value && typeof value["$lte"] !== "undefined";
    },
    process: ({ key, value, args }) => {
        args.expression += `#${key} <= :${key}`;
        args.attributeNames[`#${key}`] = key;
        args.attributeValues[`:${key}`] = value["$lte"]
    }
};

export default lte;
