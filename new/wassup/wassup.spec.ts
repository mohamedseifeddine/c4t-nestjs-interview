import { wassupAuthentication, ValidationTimeCookie } from "./WassupAuthentication"

describe('test wassup',()=>{

    test.skip("get cookie",async()=>{
    const result =  await wassupAuthentication('https://sso.orange.fr/WT/userinfo/',"imen.bouhamed.test@orange.fr","Imen.bouhamed00",ValidationTimeCookie.SixMonths)
        expect(result).toEqual("")
    })
    test.skip('get cookie in staging',async()=>{
        const result =  await wassupAuthentication('https://sso-ints.orange.fr/WT/userinfo/',"prowebxmstb203@orange.fr","Passwd01",ValidationTimeCookie.SixMonths)
        expect(result).toEqual("")
    })
})
