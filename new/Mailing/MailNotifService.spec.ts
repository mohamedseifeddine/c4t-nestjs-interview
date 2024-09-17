import { expect, test, jest } from '@jest/globals';
import * as nodemailer from 'nodemailer';
import { MailNotifService } from './MailNotifService';

interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
}


jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn((mailOptions: MailOptions) => {
            // Simulate successful mail sending
            return Promise.resolve({
                messageId: '123',
                accepted: [mailOptions.to],
                rejected: [],
                pending: []
            });
        }),
    })),
}));



describe('MailNotifService', () => {
    let mailNotifService: MailNotifService;

    beforeEach(() => {
        mailNotifService = new MailNotifService();
    });
    test('send an email with the correct recipient', async () => {
        await mailNotifService.notify();
        const createTransportMock = nodemailer.createTransport as unknown as jest.Mock<any>;
        const sendMailMock = createTransportMock.mock.results[0].value.sendMail;

        
        const sentMailOptions = sendMailMock.mock.calls[0][0] as MailOptions;

        expect(sentMailOptions.to).toBe('seif123@yopmail.com');
    });

    test('send an email with the correct sender', async () => {
        await mailNotifService.notify();
        const createTransportMock = nodemailer.createTransport as unknown as jest.Mock<any>;
        const sendMailMock = createTransportMock.mock.results[0].value.sendMail;

        const sentMailOptions = sendMailMock.mock.calls[0][0] as MailOptions;

        expect(sentMailOptions.from).toBe('noreply.internet@orange.com');
    });

    
    test('send an email with the correct subject', async () => {
        await mailNotifService.notify();
        const createTransportMock = nodemailer.createTransport as unknown as jest.Mock<any>;
        const sendMailMock = createTransportMock.mock.results[0].value.sendMail;

        
        const sentMailOptions = sendMailMock.mock.calls[0][0] as MailOptions;

        expect(sentMailOptions.subject).toBe("Notification de réception d'un SMS");
    });

    test('send an email with the correct HTML content', async () => {
        await mailNotifService.notify();
        const createTransportMock = nodemailer.createTransport as unknown as jest.Mock<any>;
        const sendMailMock = createTransportMock.mock.results[0].value.sendMail;

    
        const sentMailOptions = sendMailMock.mock.calls[0][0] as MailOptions;

        expect(sentMailOptions.html).toContain("Notification de réception d'un SMS");
    });

    test('call sendMail function exactly once', async () => {
        await mailNotifService.notify();
        const createTransportMock = nodemailer.createTransport as unknown as jest.Mock<any>;
        const sendMailMock = createTransportMock.mock.results[0].value.sendMail;

        expect(sendMailMock).toHaveBeenCalledTimes(1);
    });
});

