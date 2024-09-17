import mongoose from "mongoose";

export class StorageUtils {
    static toObjectID(id:any) {
        if (id instanceof mongoose.Types.ObjectId) {
            return id;
        }

        if (typeof id === 'string') {
            return new mongoose.Types.ObjectId(id);
        }

        return id;
    }
}