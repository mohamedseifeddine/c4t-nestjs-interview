import {ValidationTimeCookie, wassupAuthentication} from "./WassupAuthentication";
import {WassupUser} from "./WassupUser";
import WassupAdapter from "./WassupAdapter";
import {WassupAdapterInMemory, WassupUserInMemory} from "./wassupAdapterInMemory";
import {WassupAdapterPort} from "./WassupAdapterPort";
import {WassupUnknownUserError} from "./WassupUnknownUserError";


async function setupForReal(wassupAdapter: WassupAdapterPort) {
    const result = await wassupAuthentication('https://sso-ints.orange.fr/WT/userinfo/', "prowebxmstb203@orange.fr", "Passwd01", ValidationTimeCookie.SixMonths)
    const cookie = result.split('=')[1]
    return cookie
}

async function setupForTest(wassupAdapter: WassupAdapterPort) {
    const cookie = 'workingFakeCookie'
    const wassupUser = new WassupUser("ID-SMS-100-nEAKcHiGfa9YCWGbVz16FjVhBSlqdal4DqD9bTyVvz8",
        1,
        "ID-SMS-100-nEAKcHiGfa9YCWGbVz16FjVhBSlqdal4DqD9bTyVvz8",
        60,
        3,
        'prowebxmstb203@orange.fr'
    );
    (wassupAdapter as WassupAdapterInMemory).knowUserByCookie.push(new WassupUserInMemory(cookie, wassupUser));
    return cookie;
}

describe.each([[WassupAdapter, setupForReal]/*, [WassupAdapterInMemory, setupForTest]*/])(
    "Wassup Adapter %s",
    (wassupAdapterConstructor, setupFonction) => {
        const uid = "ID-SMS-100-nEAKcHiGfa9YCWGbVz16FjVhBSlqdal4DqD9bTyVvz8";
        const wassupUser = new WassupUser(uid,
            1,
            uid,
            444,
            3,
            'prowebxmstb203@orange.fr'
        );

        test('Get auth-wassup succeed with cookie', async () => {
            const wassupAdapter = new wassupAdapterConstructor();
            const cookie = await setupFonction(wassupAdapter);

            const user = await wassupAdapter.getUserWithCookie(cookie)

            expect(user!).toEqual(wassupUser)
        });

        test('Get auth-wassup succeed with uid', async () => {
            const wassupAdapter = new wassupAdapterConstructor();
            const cookie = await setupFonction(wassupAdapter);

            const user = await wassupAdapter.getUserWithUid(uid)

            expect(user).toEqual(wassupUser)
        });

        test('Get auth-wassup failure', async () => {
            const cookie = "fake_cookie"
            await expect(new wassupAdapterConstructor().getUserWithCookie(cookie)).rejects.toThrow(new WassupUnknownUserError())
        });
    })
