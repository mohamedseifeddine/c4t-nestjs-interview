import mongoose from "mongoose";
import { PartnerInfoForLog } from "../logger/PartnerInfoForLog";
import { PartnerLoggerAdapter } from "../logger/PartnerLoggerAdapter";
import { PartnerRequestInfoForLog } from "../logger/PartnerRequestInfoForLog";
import { PartnerResponseInfoForLog } from "../logger/PartnerResponseInfoForLog";
import { TemplateMongoClientWithLog } from "./TemplateMongoClientWithLog";

class MongoPartnerResponseInfoForLog extends PartnerResponseInfoForLog {
    constructor(public readonly method: string, public readonly response = '') {
        super();
    }

    onAfterCall() {
        return {
            method: this.method
        }
    }
}

class MongoPartnerRequestInfoForLog extends PartnerRequestInfoForLog {
    constructor(public readonly method: string) {
        super();
    }

    onBeforeCall() {
        return {
            method: this.method
        }
    }

    onAfterCall() {
        return {
            method: this.method
        }
    }

    onErrorCall() {
        return {
            method: this.method
        }
    }
}

class MongoPartnerInfoForLog extends PartnerInfoForLog {
    constructor(public readonly collection: string) {
        super('MongoDB');
    }

    onBeforeCall() {
        return {
            collection: this.collection
        }
    }

    onAfterCall() {
        return {
            collection: this.collection
        }
    }

    onErrorCall() {
        return {
            collection: this.collection
        }
    }
}

export class MongoModelWithLog extends TemplateMongoClientWithLog {

    private logger:PartnerLoggerAdapter;

    constructor(private model: mongoose.Model<any>) {
        super()
        this.logger = new PartnerLoggerAdapter(
            MongoModelWithLog,
            new MongoPartnerInfoForLog(model.modelName)
        );
    }

    protected beforeCall(method: string) {
        this.logger.beforeCall(new MongoPartnerRequestInfoForLog(method));
    }

    protected afterCall(method: string) {
        this.logger.afterCall(new MongoPartnerResponseInfoForLog(method));
    }

    protected errorOnCall(method: string, error: string) {
        this.logger.errorOnCall(new MongoPartnerResponseInfoForLog(method, error));
    }
    async create(param: any) {
        return this.executeWithLogging('create', () => this.model.create(param));
    }

    async find(filter: any) {
        return this.executeWithLogging('find', () => this.model.find(filter));
    }

    async findOne(filter: any) {
        return this.executeWithLogging('findOne', () => this.model.findOne(filter));
    }

    async findOneAndUpdate(filter?: any, update?: mongoose.UpdateQuery<any>, option?: any) {
        return this.executeWithLogging('findOneAndUpdate', () => this.model.findOneAndUpdate(filter, update, option));
    }

    async updateOne(filter?: any, update?: mongoose.UpdateQuery<any>, option?: any) {
        return this.executeWithLogging('updateOne', () => this.model.updateOne(filter, update, option));
    }
    async aggregate(pipeline:any){
        return this.executeWithLogging('aggregate',()=> this.model.aggregate(pipeline))
    }
    async updateMany(filter?: any, update?: mongoose.UpdateQuery<any>, option?: any){
        return this.executeWithLogging('updateMany',()=> this.model.updateMany(filter, update, option))
    }

    async deleteOne(filter: any,  option?: any) {
        return this.executeWithLogging('deleteOne', () => this.model.deleteOne(filter,option));
    }
    async countDocuments(filter: any,  option?: any) {
        return this.executeWithLogging('countDocuments', () => this.model.countDocuments(filter,option));
    }
}
