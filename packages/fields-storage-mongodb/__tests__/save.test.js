import useModels from "./models/useModels";

describe("save test", function() {
    const { models, getCollection } = useModels();

    it("must save", async () => {
        const { SimpleModel } = models;
        const simpleModel = new SimpleModel();
        await simpleModel.save();

        let items = await getCollection("SimpleModel")
            .find()
            .toSimpleArray();

        expect(items).toEqual([{ _id: simpleModel.id, id: simpleModel.id, enabled: true }]);

        simpleModel.name = "test2";
        await simpleModel.save();

        items = await getCollection("SimpleModel")
            .find()
            .toSimpleArray();
        expect(items).toEqual([
            { _id: simpleModel.id, id: simpleModel.id, enabled: true, name: "test2", slug: "test2" }
        ]);
    });

    it("should save a new model and it should receive a new ID", async () => {
        const { SimpleModel } = models;
        const simpleModel = new SimpleModel();
        await simpleModel.save();

        expect(simpleModel.id.length).toBe(24);
        expect(SimpleModel.isId(simpleModel.id)).toBe(true);
    });

    it(`"id" should be the same after update`, async () => {
        const { SimpleModel } = models;
        const simpleModel = new SimpleModel();
        await simpleModel.save();

        const newId = simpleModel.id;

        await simpleModel.save();
        expect(simpleModel.id).toBe(newId);
    });
});


