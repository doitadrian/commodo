import sinon from "sinon";
import User from "./resources/models/User";
import mdbid from "mdbid";

const sandbox = sinon.createSandbox();
describe("findOne test", function() {
    afterEach(() => sandbox.restore());

    it("findOne - must NOT throw an error if storage data is invalid", async () => {
        const findOneStub = sandbox.stub(User.getStorageDriver(), "find").callsFake(() => {
            return [
                [
                    {
                        id: mdbid(),
                        enabled: 123
                    }
                ],
                {}
            ];
        });

        await User.findOne({ query: { id: mdbid() } });
        findOneStub.restore();
    });
});
