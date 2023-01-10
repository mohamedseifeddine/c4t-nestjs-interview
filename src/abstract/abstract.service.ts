import { AbstractModel } from './abstract.model';
import {
  FilterQuery,
  Model,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from 'mongoose';
import { MongoError } from 'mongodb';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'winston';

export abstract class AbstractService<T extends AbstractModel> {
  protected constructor(
    private model: Model<T>,
    private readonly loggerWinston: Logger,
  ) {}

  protected abstract modelName;

  getModelName(): string {
    return this.modelName.toUpperCase();
  }

  async findOne(
    filterQuery: FilterQuery<T>,
    projection?: any | null,
    options?: QueryOptions | null,
  ): Promise<T> {
    try {
      return await this.model.findOne(filterQuery, projection, options);
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async findById(
    id: any,
    projection?: any | null,
    options?: QueryOptions,
  ): Promise<T> {
    let result;
    try {
      const query = this.model.findById(id, projection, options);
      result = await query;
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
    if (!result) {
      throw new NotFoundException(
        `NOT_FOUND_${this.getModelName()} ID-(${id})`,
      );
    }
    return result.toObject();
  }

  async find(
    filterQuery: FilterQuery<T>,
    projection?: any | null,
    options?: QueryOptions | null,
    sortField?: any,
  ): Promise<T[]> {
    let data;
    try {
      data = await this.model
        .find(filterQuery, projection, options)
        .sort({ ...sortField });
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
    return data;
  }

  async count(
    filter: FilterQuery<T>,
    options?: QueryOptions | null,
  ): Promise<number> {
    try {
      return await this.model.find(filter, options).count();
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async create(model: any): Promise<T> {
    try {
      return await this.model.create(model);
    } catch (e) {
      if ((e as MongoError) && e.code === 11000) {
        throw new BadRequestException(
          `DUPLICATION_ERROR_${this.getModelName()}`,
        );
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async findByIdAndUpdate(
    id: Types.ObjectId,
    updateQuery: UpdateQuery<T>,
    options: QueryOptions | null = { new: true },
  ): Promise<T> {
    let data;
    try {
      data = await this.model.findByIdAndUpdate(id, updateQuery, options);
    } catch (e) {
      if ((e as MongoError) && e.code === 11000) {
        throw new BadRequestException(
          `DUPLICATION_ERROR_${this.getModelName()}`,
        );
      }
      throw new InternalServerErrorException(e.message);
    }
    if (!data) {
      throw new NotFoundException(
        `NOT_FOUND_${this.getModelName()} ID-(${id})`,
      );
    }

    return data;
  }

  async updateOne(
    filter?: FilterQuery<T>,
    update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions | null,
    errorMessage?: string,
  ): Promise<UpdateWriteOpResult> {
    let data;
    try {
      data = await this.model.updateOne(filter, update, options);
    } catch (e) {
      if ((e as MongoError) && e.code === 11000) {
        throw new BadRequestException(
          `DUPLICATION_ERROR_${this.getModelName()}`,
        );
      }
      throw new InternalServerErrorException(e.message);
    }

    if (errorMessage && data.modifiedCount === 0 && data.matchedCount === 0) {
      this.loggerWinston.error(
        `UPDATE_NONE_${this.getModelName()}, ERROR_MESSAGE: ${errorMessage}`,
      );
      throw new BadRequestException(errorMessage);
    } else return data;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateQuery: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T> {
    const data = await this.model.findOneAndUpdate(
      filterQuery,
      updateQuery,
      options,
    );

    return data as T;
  }

  async findByIdAndDelete(id: Types.ObjectId): Promise<T> {
    const data = await this.model.findByIdAndDelete(id);
    if (!data) {
      throw new NotFoundException(
        `NOT_FOUND_${this.getModelName()} ID-(${id})`,
      );
    }

    return data;
  }

  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T> {
    const data = this.model.findOneAndDelete(filterQuery);
    if (!data) {
      throw new NotFoundException(
        `NOT_FOUND_${this.getModelName()} FILTER-${JSON.stringify(
          filterQuery,
        )}`,
      );
    }

    return data;
  }
}
