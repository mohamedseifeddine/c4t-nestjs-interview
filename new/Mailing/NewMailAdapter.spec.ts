import { error } from "console";
import { SetUpUserForTest } from "../User/SetUpUserForTest";
import { UserStorageInMemory } from "../User/storageAdapter/UserStorageInMemory";
import { NewMailAdapter } from "./NewMailAdapter";
import { NewMailAdapterInMemory } from "./NewMailAdapterInMemory";
import { MailAdapterPort } from "./NewMailAdapterPort";
import { MailApiError } from "./Errors/MailApiError";

describe.each([[NewMailAdapter], [NewMailAdapterInMemory]])("New Mail Adapter E2E test", (mailAdapterC) => {
  let mailAdapter: MailAdapterPort
  let userStorage: UserStorageInMemory;

  beforeEach(() => {
    userStorage = new UserStorageInMemory();
    mailAdapter = new mailAdapterC();
  })

  test.skip('Successfully deposits message', async () => {
    const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
    await expect(mailAdapter.depositMessage(user, 'test mail content')).resolves.not.toThrow();
  });

  if (mailAdapterC === NewMailAdapterInMemory) {
    test("Throws error when set to throw", async () => {
      (mailAdapter as NewMailAdapterInMemory).throwError = true;
      const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');

      await expect(mailAdapter.depositMessage(user, 'test mail content')).rejects.toThrow(MailApiError);
    })

    test("Does not throw error when set to not throw", async () => {
      (mailAdapter as NewMailAdapterInMemory).throwError = false;
      const user = await SetUpUserForTest.createUserInStorage(userStorage, 'aUid', 'aPuid');
      await expect(mailAdapter.depositMessage(user, 'test mail content')).resolves.not.toThrow();
    });
  }
});