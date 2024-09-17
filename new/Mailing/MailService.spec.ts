import { jest } from '@jest/globals';
import { MessageStoredBuilder } from '../message/domain/model/MessageStoredBuilder';
import { UserStorageInMemory } from '../User/storageAdapter/UserStorageInMemory';
import { MessageStorageInMemory } from '../message/adapters/storageAdapter/MessageStorageInMemory';
import { SetUpUserForTest } from '../User/SetUpUserForTest';
import { MailService } from './MailService';


jest.mock('nodemailer', () => ({
    createTransport: require('nodemailer-mock').createTransport,
}));



describe('EmailService', () => {
    const phoneNumber = '+33123456789';
    let messageStorage = new MessageStorageInMemory();
    let userStorage: UserStorageInMemory;
    let messageStoredBuilder: MessageStoredBuilder;
    let service: MailService;

    beforeEach(() => {
        userStorage = new UserStorageInMemory();
        messageStorage = new MessageStorageInMemory();
        messageStoredBuilder = new MessageStoredBuilder();
        service = new MailService(messageStorage, userStorage);;
    });

    test('return the correct "From" field for outbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withUserId(user.id).build();
        const from = service.getFromField(message, 'outbox', user);
        expect(from).toBe(`${user.ulo} <${user.ulo}>`);
    });

    test('return the correct "From" field for inbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const from = service.getFromField(message, 'inbox', user);
        expect(from).toBe(`${phoneNumber} <unknown@unknown.com>`);
    });

    test('return the correct "To" field for outbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const to = service.getToField(message, 'outbox', user);
        expect(to).toBe(`${phoneNumber} <unknown@unknown.com>`);
    });

    test('return the correct "To" field for inbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const to = service.getToField(message, 'inbox', user);
        expect(to).toBe(`${user.ulo} <${user.ulo}>`);
    });

    test('return the correct "X-WUM-FROM" field for outbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const wumFrom = service.getWumFromField(message, 'outbox', user);
        expect(wumFrom).toBe(`${user.ulo} <${user.ulo}>`);
    });

    test('return the correct "X-WUM-FROM" field for inbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const wumFrom = service.getWumFromField(message, 'inbox', user);
        expect(wumFrom).toBe(`${phoneNumber} <${phoneNumber}>`);
    });

    test('return the correct "X-WUM-TO" field for outbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const wumTo = service.getWumToField(message, 'outbox', user);
        expect(wumTo).toBe(`${phoneNumber} <${phoneNumber}>`);
    });

    test('return the correct "X-WUM-TO" field for inbox', async () => {
        const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
        const message = messageStoredBuilder.withDestinationPhoneNumber(phoneNumber).withUserId(user.id).build();
        const wumTo = service.getWumToField(message, 'inbox', user);
        expect(wumTo).toBe(`${user.ulo} <${user.ulo}>`);
    });    
})