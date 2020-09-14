class BatchProcess {
    constructor(batch, documentClient) {
        this.documentClient = documentClient;
        this.batch = batch;

        this.resolveBuild = null;
        this.rejectBuild = null;
        this.queryBuild = new Promise((resolve, reject) => {
            this.resolveBuild = resolve;
            this.rejectBuild = reject;
        });

        this.resolveExecution = null;
        this.rejectExecution = null;
        this.queryExecution = new Promise((resolve, reject) => {
            this.resolveExecution = resolve;
            this.rejectExecution = reject;
        });

        this.operations = [];
        this.results = [];
        this.response = [];

        this.batchType;
    }

    waitStartExecution() {
        return this.queryBuild;
    }

    waitExecution() {
        return this.queryExecution;
    }

    addBatchOperation(type, args, meta = {}) {
        if (!this.batchType) {
            this.batchType = type;
        } else if (this.batchType !== type) {
            const initial = this.batchType;
            const index = this.operations.length;
            this.rejectBuild({
                message: `Cannot batch operations - all operations must be of the same type (the initial operation type was "${initial}", and operation type on index "${index}" is "${type}").`
            });
            return;
        }

        this.operations.push([args, meta]);
        const index = this.operations.length - 1;
        return () => this.results[index];
    }

    addBatchWrite(args) {
        return this.addBatchOperation("batchWrite", args);
    }

    addBatchDelete(args) {
        return this.addBatchOperation("batchWrite", { ...args }, { delete: true });
    }

    addBatchGet(args) {
        return this.addBatchOperation("batchGet", args);
    }

    allOperationsAdded() {
        return this.operations.length === this.batch.getStorageDriverOperations().length;
    }

    startExecution() {
        this.resolveBuild();

        const documentClientArgs = {
            ReturnConsumedCapacity: "INDEXES"
        };

        let reject = e => {
            e.message = `An error occurred while executing "${this.batchType}" batch operation: ${e.message}`;
            return this.rejectExecution(e);
        };

        let resolve = response => {
            this.response = response;
            this.resolveExecution();
        };

        switch (this.batchType) {
            case "batchWrite":
                documentClientArgs.RequestItems = {};
                for (let i = 0; i < this.operations.length; i++) {
                    let [args, meta] = this.operations[i];

                    if (!documentClientArgs.RequestItems[args.tableName]) {
                        documentClientArgs.RequestItems[args.tableName] = [];
                    }

                    const push = {};
                    if (meta.delete) {
                        push.DeleteRequest = {
                            Key: args.query
                        };
                    } else {
                        push.PutRequest = {
                            Item: args.data
                        };
                    }

                    documentClientArgs.RequestItems[args.tableName].push(push);
                }
                break;
            case "batchGet":
                documentClientArgs.RequestItems = {};
                for (let i = 0; i < this.operations.length; i++) {
                    let [args] = this.operations[i];

                    if (!documentClientArgs.RequestItems[args.tableName]) {
                        documentClientArgs.RequestItems[args.tableName] = { Keys: [] };
                    }

                    documentClientArgs.RequestItems[args.tableName].Keys.push(args.query);
                }

                resolve = response => {
                    this.response = response;
                    const results = [];

                    // The results of batchGet aren't ordered so we have to figure out the order of results ourselves.
                    for (let i = 0; i < this.operations.length; i++) {
                        const [args] = this.operations[i];
                        const responseItems = response.Responses[args.tableName];

                        let foundResult = null;
                        outer: for (let j = 0; j < responseItems.length; j++) {
                            const responseItem = responseItems[j];
                            for (let queryKey in args.query) {
                                if (
                                    typeof responseItem[queryKey] === "undefined" ||
                                    args.query[queryKey] !== responseItem[queryKey]
                                ) {
                                    continue outer;
                                }
                            }
                            foundResult = responseItem;
                        }

                        results.push(foundResult);
                    }

                    this.results = results;
                    this.resolveExecution();
                };
                break;
        }

        this.documentClient[this.batchType](documentClientArgs)
            .promise()
            .then(resolve)
            .catch(reject);
    }
}

export default BatchProcess;
